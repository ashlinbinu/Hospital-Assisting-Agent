import json
from typing import TypedDict
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv  # 👈 Add this line

# Load your environment variables from the .env file!
load_dotenv()

class TriageState(TypedDict):
    patient_id: int
    symptoms: str
    priority_level: str
    priority_score: int
    emergency_flag: bool
    status_message: str

# Change this line inside app/agents/severity_agent.py

# Update this line inside app/agents/severity_agent.py
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.1)

def analyze_symptoms_node(state: TriageState) -> TriageState:
    prompt = f"""
    You are an AI Hospital Operational Flow Coordinator.
    Analyze the following patient symptom presentation text: "{state['symptoms']}".
    
    Classify the operational urgency strictly into one of these categories: Low, Medium, High, Critical.
    Provide an integer score between 1 (completely non-urgent) and 10 (immediate life threat).
    Set 'emergency_flag' to true if the priority score is 8 or above.
    
    CRITICAL CONSTRAINT: You are a logistics tool optimized for queue ordering. 
    Do NOT offer a medical diagnosis, do NOT name diseases, and do NOT suggest medications.
    
    Output your assessment format strictly as a valid minified JSON object matching these exact keys:
    {{"priority_level": "string", "priority_score": int, "emergency_flag": bool}}
    """
    response = llm.invoke(prompt)
    clean_content = response.content.replace("```json", "").replace("```", "").strip()
    data = json.loads(clean_content)
    
    return {
        **state,
        "priority_level": data["priority_level"],
        "priority_score": data["priority_score"],
        "emergency_flag": data["emergency_flag"]
    }

# Build the base workflow configuration
workflow = StateGraph(TriageState)
workflow.add_node("analyze_symptoms", analyze_symptoms_node)
workflow.set_entry_point("analyze_symptoms")
workflow.add_edge("analyze_symptoms", END)
severity_agent = workflow.compile()