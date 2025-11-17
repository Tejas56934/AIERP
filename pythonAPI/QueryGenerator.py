def text_to_sql(text):
    if "students" in text.lower():
        return "SELECT * FROM students;"
    return "SELECT * FROM data;"
