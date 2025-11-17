import google.generativeai as genai, os
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
def generate_text(prompt):
    model = genai.GenerativeModel("gemini-1.5-pro")
    res = model.generate_content(prompt)
    return res.text
