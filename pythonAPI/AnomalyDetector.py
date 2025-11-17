def detect_anomaly(data):
    return [val for val in data if val[0] > 30]
