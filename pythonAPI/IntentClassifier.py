def classify_intent(text):
    if "generate" in text: return "generate"
    elif "fetch" in text: return "fetch"
    elif "report" in text: return "analyze"
    return "unknown"
