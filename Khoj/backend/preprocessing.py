import math
from collections.abc import Mapping


BOOLEAN_COLUMNS = (
    "itch",
    "grew",
    "hurt",
    "changed",
    "bleed",
    "elevation",
    "skin_cancer_history",
    "cancer_history",
)
NUMERIC_COLUMNS = {
    "age": ("age", 100.0, 120.0),
    "diameter_1": ("diameter_1", 20.0, 500.0),
    "diameter_2": ("diameter_2", 20.0, 500.0),
}
INPUT_COLUMNS = {*BOOLEAN_COLUMNS, *NUMERIC_COLUMNS, "region", "gender"}


def build_metadata_vector(metadata: Mapping[str, object], model_info: Mapping[str, object]) -> list[float]:
    unknown_columns = set(metadata) - INPUT_COLUMNS
    if unknown_columns:
        raise ValueError(f"Unknown metadata fields: {', '.join(sorted(unknown_columns))}")

    columns = model_info["columns"]
    medians = model_info["medians"]
    if not isinstance(columns, list) or not isinstance(medians, dict):
        raise ValueError("Model metadata must define feature columns and medians.")

    values = {column: 0.0 for column in columns}

    for column in BOOLEAN_COLUMNS:
        raw_value = metadata.get(column)
        if raw_value is None or raw_value == "":
            continue
        if isinstance(raw_value, bool):
            values[column] = float(raw_value)
            continue
        normalized = str(raw_value).strip().lower()
        if normalized not in {"true", "false"}:
            raise ValueError(f"{column} must be true, false, or omitted.")
        values[column] = float(normalized == "true")

    for input_name, (feature_name, scale, maximum) in NUMERIC_COLUMNS.items():
        raw_value = metadata.get(input_name)
        if raw_value is None or raw_value == "":
            value = float(medians[feature_name])
        else:
            if isinstance(raw_value, bool):
                raise ValueError(f"{input_name} must be a number.")
            try:
                value = float(raw_value)
            except (TypeError, ValueError) as error:
                raise ValueError(f"{input_name} must be a number.") from error
        if not math.isfinite(value) or value < 0 or value > maximum:
            raise ValueError(f"{input_name} must be between 0 and {maximum:g}.")
        values[feature_name] = value / scale

    region = metadata.get("region")
    if region not in (None, ""):
        if not isinstance(region, str):
            raise ValueError("region must be a string.")
        feature_name = f"reg_{region.strip().upper()}"
        if feature_name not in values:
            raise ValueError("region is not supported by this model.")
        values[feature_name] = 1.0

    gender = metadata.get("gender")
    if gender in (None, ""):
        gender_feature = "g_NA"
    elif isinstance(gender, str):
        gender_feature = f"g_{gender.strip().upper()}"
    else:
        raise ValueError("gender must be FEMALE, MALE, or NA.")
    if gender_feature not in values:
        raise ValueError("gender must be FEMALE, MALE, or NA.")
    values[gender_feature] = 1.0

    return [values[column] for column in columns]
