import json
import unittest
from pathlib import Path

from backend.preprocessing import build_metadata_vector


MODEL_INFO_PATH = Path(__file__).resolve().parents[2] / "meta_info.json"


class MetadataPreprocessingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with MODEL_INFO_PATH.open(encoding="utf-8") as metadata_file:
            cls.model_info = json.load(metadata_file)

    def test_feature_order_scaling_and_defaults_match_training(self):
        values = build_metadata_vector(
            {
                "itch": True,
                "age": 50,
                "diameter_1": 12,
                "diameter_2": 6,
                "region": "FOREARM",
                "gender": "FEMALE",
            },
            self.model_info,
        )
        features = dict(zip(self.model_info["columns"], values, strict=True))

        self.assertEqual(len(values), 28)
        self.assertEqual(features["itch"], 1.0)
        self.assertEqual(features["age"], 0.5)
        self.assertEqual(features["diameter_1"], 0.6)
        self.assertEqual(features["diameter_2"], 0.3)
        self.assertEqual(features["reg_FOREARM"], 1.0)
        self.assertEqual(features["g_FEMALE"], 1.0)
        self.assertEqual(features["grew"], 0.0)

    def test_missing_metadata_uses_training_defaults(self):
        features = dict(
            zip(
                self.model_info["columns"],
                build_metadata_vector({}, self.model_info),
                strict=True,
            )
        )

        self.assertEqual(features["age"], 0.62)
        self.assertEqual(features["diameter_1"], 0.5)
        self.assertEqual(features["diameter_2"], 0.4)
        self.assertEqual(features["g_NA"], 1.0)
        self.assertEqual(features["itch"], 0.0)

    def test_invalid_metadata_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "region is not supported"):
            build_metadata_vector({"region": "UNKNOWN"}, self.model_info)

        with self.assertRaisesRegex(ValueError, "age must be between"):
            build_metadata_vector({"age": float("nan")}, self.model_info)

        with self.assertRaisesRegex(ValueError, "age must be between"):
            build_metadata_vector({"age": 121}, self.model_info)


if __name__ == "__main__":
    unittest.main()
