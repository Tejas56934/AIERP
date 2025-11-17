from fastapi import FastAPI, Query
from IntentClassifier import classify_intent
from EntityRecognizer import extract_entities
from TextGenerator import generate_text
from QueryGenerator import text_to_sql
from Recommender import recommend_user_actions
from AnomalyDetector import detect_anomaly
from WorkflowPredictor import predict_workflow

app = FastAPI()

@app.get("/")
def root():
    return {"status": "Python AI API running successfully"}

@app.get("/intent")
def get_intent(text: str = Query(...)):
    return {"intent": classify_intent(text)}

@app.get("/entities")
def get_entities(text: str = Query(...)):
    return {"entities": extract_entities(text)}

@app.get("/generate")
def get_generated_text(prompt: str = Query(...)):
    return {"response": generate_text(prompt)}

@app.get("/query")
def get_query(text: str = Query(...)):
    return {"sql": text_to_sql(text)}

@app.get("/recommend")
def get_recommendation():
    dummy_vector = [1, 0, 0]
    dataset = [[1,0,0], [0,1,0], [0,0,1]]
    return {"recommendations": recommend_user_actions(dummy_vector, dataset)}

@app.get("/anomaly")
def get_anomalies():
    data = [[10], [12], [13], [40]]  # example input
    return {"anomalies": detect_anomaly(data)}

@app.get("/workflow")
def get_workflow():
    return {"prediction": predict_workflow()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=5000)
