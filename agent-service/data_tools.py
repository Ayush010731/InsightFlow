
import json
from io import StringIO

import pandas as pd
from langchain.tools import tool


MAX_ROWS = 10000
MAX_COLUMNS = 100


def analyze_csv(csv_text: str) -> dict:
    """Generate structured, report-ready analysis from CSV text."""

    if not csv_text or not csv_text.strip():
        raise ValueError("CSV data is empty.")

    df = pd.read_csv(StringIO(csv_text))

    if df.empty:
        raise ValueError("CSV contains no data rows.")

    if len(df.columns) > MAX_COLUMNS:
        raise ValueError(f"CSV has too many columns (maximum {MAX_COLUMNS}).")

    original_rows = len(df)
    df = df.head(MAX_ROWS).copy()

    # Dataset overview
    overview = {
        "total_rows": int(original_rows),
        "rows_analyzed": int(len(df)),
        "total_columns": int(len(df.columns)),
        "duplicate_rows": int(df.duplicated().sum()),
        "columns": [str(col) for col in df.columns],
    }

    # Missing value analysis
    missing_values = {}

    for column in df.columns:
        missing_count = int(df[column].isna().sum())

        missing_values[str(column)] = {
            "count": missing_count,
            "percentage": round(
                (missing_count / len(df)) * 100, 2
            )
        }

    # Numeric analysis
    numeric_summary = {}

    numeric_df = df.select_dtypes(include="number")

    for column in numeric_df.columns:
        series = numeric_df[column].dropna()

        if series.empty:
            continue

        numeric_summary[str(column)] = {
            "count": int(series.count()),
            "sum": round(float(series.sum()), 2),
            "mean": round(float(series.mean()), 2),
            "median": round(float(series.median()), 2),
            "std": round(float(series.std()), 2) if len(series) > 1 else 0,
            "min": round(float(series.min()), 2),
            "max": round(float(series.max()), 2),
        }

    # Categorical analysis
    categorical_summary = {}

    categorical_df = df.select_dtypes(
        include=["object", "category", "bool"]
    )

    for column in categorical_df.columns:
        counts = categorical_df[column].dropna().astype(str).value_counts()

        categorical_summary[str(column)] = {
            "unique_values": int(counts.size),
            "top_categories": [
                {
                    "category": str(category),
                    "count": int(count)
                }
                for category, count in counts.head(5).items()
            ]
        }

    return {
        "overview": overview,
        "missing_values": missing_values,
        "numeric_summary": numeric_summary,
        "categorical_summary": categorical_summary,
    }


@tool
def analyze_csv_tool(csv_text: str) -> str:
    """
    Analyze supplied CSV data.

    Use this tool for dataset summaries, numerical statistics,
    missing values, duplicate records and categorical analysis.
    Always use actual tool results for calculated values.
    """

    try:
        result = analyze_csv(csv_text)

        return json.dumps(
            result,
            ensure_ascii=False,
            allow_nan=False
        )

    except Exception as exc:
        return json.dumps({
            "error": str(exc)
        }, ensure_ascii=False)




@tool
def generate_chart_data_tool(
    csv_text: str,
    chart_type: str = "bar",
    x_column: str = "",
    y_column: str = ""
) -> str:
    """
    Generate chart-ready data from the supplied CSV.

    Use this tool when the user explicitly requests a chart,
    graph, plot, or data visualization.

    Supported chart types: bar, line, area, pie.
    Automatically selects suitable columns if not provided.
    """

    try:
        if not csv_text or not csv_text.strip():
            raise ValueError("CSV data is empty.")

        allowed_types = {"bar", "line", "area", "pie"}

        chart_type = chart_type.lower().strip()

        if chart_type not in allowed_types:
            raise ValueError(
                "Unsupported chart type. Use bar, line, area, or pie."
            )

        df = pd.read_csv(StringIO(csv_text)).head(MAX_ROWS).copy()

        if df.empty:
            raise ValueError("CSV contains no data rows.")

        if len(df.columns) > MAX_COLUMNS:
            raise ValueError("CSV has too many columns.")

        numeric_columns = df.select_dtypes(
            include="number"
        ).columns.tolist()

        categorical_columns = [
            col for col in df.columns
            if col not in numeric_columns
        ]

        # Automatically select X column
        if not x_column:
            if categorical_columns:
                x_column = str(categorical_columns[0])
            else:
                raise ValueError(
                    "No suitable categorical column found for X-axis."
                )

        # Automatically select Y column
        if not y_column:
            if numeric_columns:
                y_column = str(numeric_columns[0])
            else:
                raise ValueError(
                    "No numeric column found for Y-axis."
                )

        if x_column not in df.columns:
            raise ValueError(f"Column not found: {x_column}")

        if y_column not in df.columns:
            raise ValueError(f"Column not found: {y_column}")

        if not pd.api.types.is_numeric_dtype(df[y_column]):
            raise ValueError(
                f"Column '{y_column}' must contain numeric values."
            )

        chart_df = df[[x_column, y_column]].copy()

        chart_df[y_column] = pd.to_numeric(
            chart_df[y_column], errors="coerce"
        )

        chart_df = chart_df.dropna()

        if chart_df.empty:
            raise ValueError("No valid chart data found.")

        grouped = (
            chart_df.groupby(x_column, dropna=True)[y_column]
            .sum()
            .reset_index()
        )

        # Keep chronological ordering for line and area charts
        if chart_type in {"line", "area"}:
            try:
                grouped["_sort_date"] = pd.to_datetime(
                    grouped[x_column], errors="raise"
                )
                grouped = grouped.sort_values("_sort_date")
                grouped = grouped.drop(columns=["_sort_date"])
            except (ValueError, TypeError):
                grouped = grouped.sort_values(x_column)
        else:
            grouped = grouped.sort_values(
                y_column, ascending=False
            )

        grouped = grouped.head(20)

        data = []

        for _, row in grouped.iterrows():
            data.append({
                str(x_column): str(row[x_column]),
                str(y_column): round(float(row[y_column]), 2)
            })

        result = {
            "type": chart_type,
            "title": f"{y_column} by {x_column}",
            "xKey": str(x_column),
            "yKey": str(y_column),
            "data": data
        }

        return json.dumps(
            result,
            ensure_ascii=False,
            allow_nan=False
        )

    except Exception as exc:
        return json.dumps({
            "error": str(exc)
        }, ensure_ascii=False)

