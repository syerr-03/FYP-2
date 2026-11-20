from flask import Flask, jsonify, request
from flask_cors import CORS
import firebase_admin
from firebase_admin import firestore

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
    "saved_models/lstm_demand_final.keras"
)

scaler_X = joblib.load(
    "saved_models/scaler_X_final.pkl"
)

scaler_y = joblib.load(
    "saved_models/scaler_y_final.pkl"
)

sequence_length = 12

# =========================
# FIREBASE PRODUCT MAPPING
# =========================

PRODUCT_CODE_MAPPING = {
    "AKMK_COMBO": "AMK_COMBO",
    "A-LOVE CLEANSING GEL (200ML)": "A-LOVE 200ML",
    "AESTAR MOISTURISING DAY CREAM 30ML": "AESTAR30"
}

# =========================
# FIREBASE CONNECTION
# =========================

if not firebase_admin._apps:
    firebase_admin.initialize_app()

firebase_db = firestore.client()

# =========================
# GET FIREBASE MONTHLY SALES
# =========================

def get_firebase_monthly_sales():
    from collections import defaultdict

    monthly_sales = defaultdict(float)

    orders = firebase_db.collection("orders").stream()

    for order in orders:
        data = order.to_dict()

        if data.get("Delivery_Status") != "Delivered":
            continue

        order_date = str(data.get("Order_Date", ""))[:7]

        if not order_date:
            continue

        for item in data.get("items", []):
            product_code = str(item.get("Product_Code", "")).strip()

            product_code = PRODUCT_CODE_MAPPING.get(
                product_code, product_code
            )

            quantity = float(item.get("Quantity", 0) or 0)

            monthly_sales[(product_code, order_date)] += quantity

    return monthly_sales


# =========================
# COMBINE EXCEL + FIREBASE DEMAND
# =========================

def get_updated_demand_data():
    updated_df = df.copy()
    monthly_sales = get_firebase_monthly_sales()

    last_excel_month = updated_df["Date"].max()

    current_month = pd.Timestamp.today().replace(day=1).normalize()

    new_rows = []

    for month in pd.date_range(
        start=last_excel_month + pd.DateOffset(months=1),
        end=current_month - pd.DateOffset(months=1),
        freq="MS"
    ):
        month_key = month.strftime("%Y-%m")

        for product_code, group in df.groupby("Product_Code"):
            product_name = group["Product_Name"].iloc[-1]

            quantity = monthly_sales.get(
                (str(product_code), month_key), 0
            )

            new_rows.append({
                "Product_Code": product_code,
                "Product_Name": product_name,
                "Date": month,
                "Net_Sold_Quantity": quantity
            })

    if new_rows:
        updated_df = pd.concat(
            [updated_df, pd.DataFrame(new_rows)],
            ignore_index=True
        )

    return updated_df.sort_values(
        ["Product_Code", "Date"]
    )


# =========================
# LOAD HISTORICAL DEMAND
# =========================

df = pd.read_excel(
    "data/FYP_Master_All_43_Products_Related.xlsx",
    sheet_name="Demand_Model_Input"
)

df["Date"] = pd.to_datetime(
    dict(
        year=pd.to_numeric(df["Year"]),
        month=pd.to_numeric(df["Month_Number"]),
        day=1
    )
)

df["Net_Sold_Quantity"] = pd.to_numeric(
    df["Net_Sold_Quantity"],
    errors="coerce"
).fillna(0)

df = df.sort_values(["Product_Code", "Date"])


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
        months = int(request.args.get("months", 6))

        if months not in [1, 3, 6, 12]:
            return jsonify({
                "error": "Months must be 1, 3, 6 or 12"
            }), 400

        today = pd.Timestamp.today()
        current_month = pd.Timestamp(
            year=today.year,
            month=today.month,
            day=1
        )

        forecast_start = current_month + pd.DateOffset(months=1)
        forecast_end = forecast_start + pd.DateOffset(months=months - 1)

        results = []

        updated_df = get_updated_demand_data()

        for product_code, group in updated_df.groupby("Product_Code"):
            group = group.sort_values("Date")

            product_name = group["Product_Name"].iloc[-1]
            history = group["Net_Sold_Quantity"].astype(float).tolist()

            if len(history) < sequence_length:
                continue

            next_date = group["Date"].max() + pd.DateOffset(months=1)

            while next_date <= forecast_end:
                lag_values = history[-12:][::-1]
                X_future = np.array(lag_values).reshape(1, 12)

                X_scaled = scaler_X.transform(X_future)
                X_lstm = X_scaled.reshape(1, 12, 1)

                prediction_scaled = model.predict(
                    X_lstm,
                    verbose=0
                )

                prediction = scaler_y.inverse_transform(
                    prediction_scaled
                )[0][0]

                prediction = max(0, float(prediction))
                history.append(prediction)

                if forecast_start <= next_date <= forecast_end:
                    results.append({
                        "Date": next_date.strftime("%Y-%m-%d"),
                        "Month": next_date.strftime("%b"),
                        "Product_Code": str(product_code),
                        "Product_Name": str(product_name),
                        "Predicted_Quantity": round(prediction, 2)
                    })

                next_date += pd.DateOffset(months=1)

        return jsonify({
            "forecast_months": months,
            "forecast_start": forecast_start.strftime("%Y-%m-%d"),
            "forecast_end": forecast_end.strftime("%Y-%m-%d"),
            "data": results
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


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


# =========================
# CUSTOMER SEGMENTATION AI RESULTS
# =========================

@app.route("/customer-segmentation", methods=["GET"])
def customer_segmentation():
    try:
        orders = []

        # 1. Read current orders from Firebase
        for doc in firebase_db.collection("orders").stream():
            data = doc.to_dict() or {}

            name = str(data.get("Customer_Name") or "").strip()
            phone = str(data.get("Phone_Number") or "").strip()

            if not name:
                continue

            customer_key = name.lower() + "|" + phone

            order_date = pd.to_datetime(
                data.get("Order_Date"),
                errors="coerce"
            )

            quantity = sum(
                float(item.get("Quantity", 0) or 0)
                for item in (data.get("items") or [])
            )

            orders.append({
                "Order_ID": str(data.get("Order_ID") or doc.id),
                "Firestore_ID": doc.id,
                "Customer_Key": customer_key,
                "Customer_Name": name,
                "Customer_ID": phone if phone else name.lower(),
                "Order_Date": order_date,
                "Quantity": quantity,
                "Delivery_Status": str(
                    data.get("Delivery_Status") or ""
                ).strip(),
                "Order_Status": str(
                    data.get("Order_Status") or ""
                ).strip()
            })

        if not orders:
            return jsonify({
                "total_customers": 0,
                "segment_counts": {},
                "data": []
            })

        df = pd.DataFrame(orders)

        # 2. Read delivery issue history
        issue_types = {}

        for doc in firebase_db.collection("delivery_issues").stream():
            issue = doc.to_dict() or {}

            order_id = str(issue.get("Order_ID") or "").strip()
            issue_type = str(
                issue.get("Delivery_Issue_Type") or ""
            ).strip()

            if order_id and issue_type:
                issue_types.setdefault(order_id, set()).add(issue_type)

        problem_statuses = {
            "canceled",
            "cancelled",
            "returned",
            "not received",
            "delayed",
            "delivery delayed"
        }

        def has_delivery_issue(row):
            statuses = {
                str(row["Delivery_Status"]).strip().lower(),
                str(row["Order_Status"]).strip().lower()
            }

            statuses.update(
                status.strip().lower()
                for status in issue_types.get(row["Order_ID"], set())
            )

            return bool(statuses & problem_statuses)

        df["Has_Issue"] = df.apply(has_delivery_issue, axis=1)

        # 3. Run existing Isolation Forest V2
        df["Has_Anomaly"] = False

        valid_orders = df[
            df["Order_Date"].notna() &
            (df["Quantity"] > 0)
        ].copy()

        if not valid_orders.empty:
            valid_orders = valid_orders.sort_values(
                ["Order_Date", "Order_ID"]
            ).reset_index(drop=True)

            valid_orders["Order_Frequency_7D"] = 0

            for customer_id, group in valid_orders.groupby("Customer_ID"):
                dates = group["Order_Date"]

                for idx, date in dates.items():
                    frequency = (
                        (dates < date) &
                        (dates >= date - pd.Timedelta(days=7))
                    ).sum()

                    valid_orders.loc[
                        idx, "Order_Frequency_7D"
                    ] = int(frequency)

            X = valid_orders[anomaly_features_v2]
            X_scaled = anomaly_scaler_v2.transform(X)

            valid_orders["Has_Anomaly"] = (
                anomaly_model_v2.predict(X_scaled) == -1
            )

            anomaly_order_ids = set(
                valid_orders.loc[
                    valid_orders["Has_Anomaly"],
                    "Firestore_ID"
                ]
            )

            df["Has_Anomaly"] = df[
                "Firestore_ID"
            ].isin(anomaly_order_ids)

        # 4. Summarize each customer
        summary = df.groupby("Customer_Key").agg(
            Customer_Name=("Customer_Name", "first"),
            Total_Orders=("Order_ID", "nunique"),
            Anomaly_Orders=("Has_Anomaly", "sum"),
            Issue_Orders=("Has_Issue", "sum")
        ).reset_index()

        summary["Order_Anomalies"] = (
            summary["Anomaly_Orders"] > 0
        )

        summary["Order_Delivery_Issues"] = (
            summary["Issue_Orders"] >= 2
        )

        summary["Segment"] = summary.apply(
            lambda row: "Customers Requiring Attention"
            if (
                row["Order_Anomalies"] or
                row["Order_Delivery_Issues"]
            )
            else "Normal Customers",
            axis=1
        )

        summary = summary.sort_values(
            "Customer_Name"
        ).reset_index(drop=True)

        segment_counts = (
            summary["Segment"].value_counts().to_dict()
        )

        return jsonify({
            "total_customers": len(summary),
            "segment_counts": segment_counts,
            "data": summary.to_dict(orient="records")
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================
# ANOMALY DETECTION - ISOLATION FOREST
# ============================================

from pathlib import Path

@app.route("/anomaly-detection", methods=["GET"])
def anomaly_detection():
    try:
        base_dir = Path(__file__).resolve().parent

        model_dir = base_dir / "saved_models"
        data_dir = base_dir / "data"

        # Load saved AI components
        model = joblib.load(
            model_dir / "Isolation_Forest_Anomaly_Model.pkl"
        )

        scaler = joblib.load(
            model_dir / "Anomaly_Scaler.pkl"
        )

        features = joblib.load(
            model_dir / "Anomaly_Features.pkl"
        )

        print("ANOMALY FEATURES:", features)

        # Load historical dataset
        df = pd.read_excel(
            data_dir / "FYP_Master_All_43_Products_Related.xlsx",
            sheet_name="Master_Order_History"
        )

        # Prepare data in the same feature order as training
        X = df[features].copy()

        # Scale and predict
        X_scaled = scaler.transform(X)

        predictions = model.predict(X_scaled)
        scores = model.decision_function(X_scaled)

        df["Anomaly_Prediction"] = predictions
        df["Anomaly_Score"] = scores

        # Isolation Forest: -1 = anomaly, 1 = normal
        anomalies = df[df["Anomaly_Prediction"] == -1].copy()

        anomalies = anomalies.sort_values(
            "Anomaly_Score",
            ascending=True
        )

        # Format dates for JSON
        if "Order_Date" in anomalies.columns:
            anomalies["Order_Date"] = pd.to_datetime(
                anomalies["Order_Date"],
                errors="coerce"
            ).dt.strftime("%Y-%m-%d")

        records = anomalies.astype(object).where(
            pd.notnull(anomalies), None
        ).to_dict(orient="records")

        return jsonify({
            "total_transactions": len(df),
            "anomalies_detected": len(anomalies),
            "normal_transactions": int(
                (predictions == 1).sum()
            ),
            "data": records
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================
# ANOMALY DETECTION V2 - LOAD MODEL
# ============================================

from pathlib import Path

BASE_DIR_V2 = Path(__file__).resolve().parent
MODEL_DIR_V2 = BASE_DIR_V2 / "saved_models"

anomaly_model_v2 = joblib.load(
    MODEL_DIR_V2 / "Isolation_Forest_Anomaly_V2.pkl"
)

anomaly_scaler_v2 = joblib.load(
    MODEL_DIR_V2 / "Anomaly_Scaler_V2.pkl"
)

anomaly_features_v2 = joblib.load(
    MODEL_DIR_V2 / "Anomaly_Features_V2.pkl"
)

print("Anomaly Detection V2 Model Loaded Successfully!")
print("V2 Features:", anomaly_features_v2)

# ============================================
# ANOMALY DETECTION V2 - FIREBASE
# ============================================

@app.route("/anomaly-detection-v2", methods=["GET"])
def anomaly_detection_v2():
    try:
        orders = []

        for doc in firebase_db.collection("orders").stream():
            data = doc.to_dict() or {}

            # Customer identity
            phone = str(data.get("Phone_Number") or "").strip()
            name = str(data.get("Customer_Name") or "").strip()

            customer_id = phone if phone else name.lower()

            # Order date
            order_date = pd.to_datetime(
                data.get("Order_Date"),
                errors="coerce"
            )

            if pd.isna(order_date):
                continue

            # Total quantity per order
            quantity = sum(
                float(item.get("Quantity", 0) or 0)
                for item in (data.get("items") or [])
            )

            if quantity <= 0:
                continue

            orders.append({
                "Order_ID": doc.id,
                "Customer_Name": name,
                "Customer_ID": customer_id,
                "Order_Date": order_date,
                "Quantity": quantity,
                "Order_Status": data.get("Order_Status", "")
            })

        if not orders:
            return jsonify({
                "total_orders": 0,
                "anomalies_detected": 0,
                "normal_orders": 0,
                "data": []
            })

        df_v2 = pd.DataFrame(orders)
        df_v2 = df_v2.sort_values(
            ["Order_Date", "Order_ID"]
        ).reset_index(drop=True)

        # Calculate previous orders within 7 days
        df_v2["Order_Frequency_7D"] = 0

        for customer_id, group in df_v2.groupby("Customer_ID"):
            dates = group["Order_Date"]

            for idx, date in dates.items():
                frequency = (
                    (dates < date) &
                    (dates >= date - pd.Timedelta(days=7))
                ).sum()

                df_v2.loc[idx, "Order_Frequency_7D"] = int(frequency)

        # AI prediction
        X_v2 = df_v2[anomaly_features_v2]

        X_scaled_v2 = anomaly_scaler_v2.transform(X_v2)

        df_v2["Anomaly_Prediction"] = (
            anomaly_model_v2.predict(X_scaled_v2)
        )

        df_v2["Anomaly_Score"] = (
            anomaly_model_v2.decision_function(X_scaled_v2)
        )

        df_v2["Anomaly_Status"] = df_v2[
            "Anomaly_Prediction"
        ].map({
            1: "Normal",
            -1: "Anomaly"
        })

        # Explanation
        def get_reason(row):
            reasons = []

            if row["Quantity"] >= 9:
                reasons.append("Unusually high order quantity")

            if row["Order_Frequency_7D"] >= 2:
                reasons.append("Frequent orders within 7 days")

            if not reasons:
                reasons.append("Unusual order pattern")

            return ", ".join(reasons)

        df_v2["Anomaly_Reason"] = df_v2.apply(
            get_reason, axis=1
        )

        anomalies = df_v2[
            df_v2["Anomaly_Prediction"] == -1
        ].copy()

        anomalies = anomalies.sort_values("Anomaly_Score")

        anomalies["Order_Date"] = anomalies[
            "Order_Date"
        ].dt.strftime("%Y-%m-%d")

        return jsonify({
            "total_orders": len(df_v2),
            "anomalies_detected": len(anomalies),
            "normal_orders": int(
                (df_v2["Anomaly_Prediction"] == 1).sum()
            ),
            "data": anomalies.to_dict(orient="records")
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/operational-risk", methods=["GET"])
def operational_risk():
    try:
        from flask import current_app
        import math

        # Reuse existing LSTM demand forecasting
        with current_app.test_request_context("/predict-demand?months=1"):
            forecast_response = predict_demand()

        if isinstance(forecast_response, tuple):
            response, status_code = forecast_response
            if status_code != 200:
                return response, status_code
        else:
            response = forecast_response

        forecast_data = response.get_json().get("data", [])

        # Read live inventory from Firebase
        inventory_docs = firebase_db.collection("inventory").stream()

        inventory_map = {}

        for doc_snapshot in inventory_docs:
            item = doc_snapshot.to_dict() or {}
            code = str(item.get("Product_Code", "")).strip().upper()

            if code:
                inventory_map[code] = item

        results = []

        for forecast in forecast_data:
            code = str(forecast["Product_Code"]).strip().upper()

            inventory = inventory_map.get(code)

            if inventory is None:
                results.append({
                    "Product_Code": code,
                    "Product_Name": forecast["Product_Name"],
                    "Risk_Level": "Unknown",
                    "Reason": "Inventory data not found"
                })
                continue

            predicted_demand = max(
                0, math.ceil(float(forecast["Predicted_Quantity"]))
            )

            available_stock = max(
                0, int(inventory.get("Available_Stock", 0))
            )

            safety_stock = max(
                0, int(inventory.get("Safety_Stock", 0))
            )

            shortage = max(0, predicted_demand - available_stock)

            # Initial rule-based risk assessment
            if predicted_demand > available_stock:
                risk_level = "High"
                recommendation = "Replenish stock before expected demand."
            elif predicted_demand > max(0, available_stock - safety_stock):
                risk_level = "Medium"
                recommendation = "Monitor stock and prepare replenishment."
            else:
                risk_level = "Low"
                recommendation = "Stock is sufficient based on forecast."

            results.append({
                "Product_Code": code,
                "Product_Name": forecast["Product_Name"],
                "Predicted_Demand": predicted_demand,
                "Available_Stock": available_stock,
                "Safety_Stock": safety_stock,
                "Potential_Shortage": shortage,
                "Risk_Level": risk_level,
                "Recommendation": recommendation
            })

        risk_order = {"High": 0, "Medium": 1, "Low": 2, "Unknown": 3}

        results.sort(
            key=lambda x: risk_order.get(x["Risk_Level"], 3)
        )

        return jsonify({
            "forecast_months": 1,
            "total_products": len(results),
            "high_risk": sum(x["Risk_Level"] == "High" for x in results),
            "medium_risk": sum(x["Risk_Level"] == "Medium" for x in results),
            "low_risk": sum(x["Risk_Level"] == "Low" for x in results),
            "data": results
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/cancellation-data-check", methods=["GET"])
def cancellation_data_check():
    try:
        counts = {
            "Canceled": 0,
            "Delivered": 0,
            "Other": 0
        }

        for doc in firebase_db.collection("orders").stream():
            order = doc.to_dict() or {}

            status = str(
                order.get("Delivery_Status") or ""
            ).strip().lower()

            if status in ["canceled", "cancelled"]:
                counts["Canceled"] += 1
            elif status == "delivered":
                counts["Delivered"] += 1
            else:
                counts["Other"] += 1

        total = sum(counts.values())

        return jsonify({
            "total_orders": total,
            "status_counts": counts,
            "cancellation_rate": round(
                counts["Canceled"] / total * 100, 2
            ) if total else 0
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)