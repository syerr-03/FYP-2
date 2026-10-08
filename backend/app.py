from flask import Flask, jsonify, request
from flask_cors import CORS

import pandas as pd
import numpy as np
import joblib

from tensorflow.keras.models import load_model


app = Flask(__name__)
CORS(app)


# =========================
# LOAD MODEL + SCALER
# =========================

model = load_model(
    "saved_models/lstm_demand_model.keras"
)

product_scalers = joblib.load(
    "saved_models/product_scalers.pkl"
)

sequence_length = joblib.load(
    "saved_models/sequence_length.pkl"
)


# =========================
# LOAD HISTORICAL SALES
# =========================

df = pd.read_excel(
    "data/new.xlsx",
    sheet_name="Combined_2024_2025",
    usecols="B:G",
    header=1
)


# =========================
# DATA CLEANING
# =========================

df = df.dropna(
    subset=[
        "Year",
        "Month",
        "Product_Code",
        "Product_Name"
    ]
).copy()

df["Quantity"] = pd.to_numeric(
    df["Quantity"],
    errors="coerce"
).fillna(0)

month_map = {
    "Jan": 1,
    "Feb": 2,
    "Mar": 3,
    "Apr": 4,
    "May": 5,
    "Jun": 6,
    "Jul": 7,
    "Aug": 8,
    "Sep": 9,
    "Oct": 10,
    "Nov": 11,
    "Dec": 12
}

df["Month_Number"] = df["Month"].map(month_map)

df["Date"] = pd.to_datetime(
    dict(
        year=df["Year"],
        month=df["Month_Number"],
        day=1
    )
)

df = (
    df.groupby(
        [
            "Product_Code",
            "Product_Name",
            "Date"
        ],
        as_index=False
    )
    .agg({
        "Quantity": "sum"
    })
)


# =========================
# HOME
# =========================

@app.route("/")
def home():
    return "OrderAI LSTM Backend is running"


# =========================
# DYNAMIC FORECAST
# =========================

@app.route("/predict-demand", methods=["GET"])
def predict_demand():

    try:
        months = int(
            request.args.get("months", 6)
        )

        if months not in [1, 3, 6, 12]:
            return jsonify({
                "error": "Months must be 1, 3, 6 or 12"
            }), 400

        # current month
        today = pd.Timestamp.today()

        current_month = pd.Timestamp(
            year=today.year,
            month=today.month,
            day=1
        )

        # forecast starts next month
        forecast_start = (
            current_month
            + pd.DateOffset(months=1)
        )

        forecast_end = (
            forecast_start
            + pd.DateOffset(months=months - 1)
        )

        results = []

        for product_code in df["Product_Code"].unique():

            if product_code not in product_scalers:
                continue

            product_data = df[
                df["Product_Code"] == product_code
            ].copy()

            product_data = (
                product_data
                .sort_values("Date")
                .reset_index(drop=True)
            )

            product_name = (
                product_data["Product_Name"].iloc[-1]
            )

            full_dates = pd.date_range(
                start=product_data["Date"].min(),
                end=product_data["Date"].max(),
                freq="MS"
            )

            temp = pd.DataFrame({
                "Date": full_dates
            })

            temp = temp.merge(
                product_data[
                    ["Date", "Quantity"]
                ],
                on="Date",
                how="left"
            )

            temp["Quantity"] = (
                temp["Quantity"]
                .fillna(0)
            )

            scaler = product_scalers[product_code]

            quantities = (
                temp["Quantity"]
                .astype(float)
                .tolist()
            )

            last_actual_date = temp["Date"].max()

            next_date = (
                last_actual_date
                + pd.DateOffset(months=1)
            )

            all_predictions = []

            while next_date <= forecast_end:

                if len(quantities) < sequence_length:
                    break

                last_sequence = np.array(
                    quantities[-sequence_length:]
                )

                sequence_df = pd.DataFrame(
                    last_sequence,
                    columns=["Quantity"]
                )

                scaled_sequence = scaler.transform(
                    sequence_df
                )

                X_future = scaled_sequence.reshape(
                    1,
                    sequence_length,
                    1
                )

                pred_scaled = model.predict(
                    X_future,
                    verbose=0
                )

                pred_quantity = (
                    scaler.inverse_transform(
                        pred_scaled
                    )[0][0]
                )

                pred_quantity = max(
                    0,
                    float(pred_quantity)
                )

                quantities.append(pred_quantity)

                all_predictions.append({
                    "Date": next_date,
                    "Predicted_Quantity": pred_quantity
                })

                next_date = (
                    next_date
                    + pd.DateOffset(months=1)
                )

            selected_predictions = [
                item
                for item in all_predictions
                if forecast_start <= item["Date"] <= forecast_end
            ]

            for prediction in selected_predictions:

                results.append({
                    "Date": prediction["Date"].strftime("%Y-%m-%d"),
                    "Month": prediction["Date"].strftime("%b"),
                    "Product_Code": product_code,
                    "Product_Name": product_name,
                    "Predicted_Quantity": round(
                        prediction["Predicted_Quantity"],
                        2
                    )
                })

        return jsonify({
            "forecast_months": months,
            "forecast_start": forecast_start.strftime("%Y-%m-%d"),
            "forecast_end": forecast_end.strftime("%Y-%m-%d"),
            "data": results
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


@app.route("/inventory", methods=["GET"])
def get_inventory():
    try:
        file_path = "data/FYP_Master_All_43_Products_Related.xlsx"

        df = pd.read_excel(
            file_path,
            sheet_name="Stock_Model_Input"
        )

        df["Year"] = pd.to_numeric(df["Year"], errors="coerce")
        df["Month_Number"] = pd.to_numeric(df["Month_Number"], errors="coerce")

        df = df.sort_values(
            by=["Product_Code", "Year", "Month_Number"]
        )

        latest_stock = (
            df.groupby("Product_Code", as_index=False)
            .tail(1)
        )

        inventory = []

        for _, row in latest_stock.iterrows():
            current_stock = int(row.get("Ending_Stock", 0) or 0)

            inventory.append({
                "Product_Code": str(row.get("Product_Code", "")),
                "Product_Name": str(row.get("Product_Name", "")),
                "Current_Stock": current_stock,
                "Reserved_Stock": 0,
                "Available_Stock": current_stock,
                "Reorder_Level": int(row.get("Reorder_Level", 0) or 0),
                "Safety_Stock": int(row.get("Safety_Stock", 0) or 0),
                "Lead_Time_Days": int(row.get("Lead_Time_Days", 0) or 0),
                "Stock_Year": int(row.get("Year", 0) or 0),
                "Stock_Month": int(row.get("Month_Number", 0) or 0),
            })

        return jsonify(inventory)

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


if __name__ == "__main__":
    app.run(debug=True)