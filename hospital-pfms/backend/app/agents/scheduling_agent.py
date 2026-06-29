import json
from typing import TypedDict, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, END
from app.tools.doctor_availability import check_doctor_availability
from app.tools.appointment_tool import book_appointment_slot
from dotenv import load_dotenv  # 👈 Add this line

# Load your environment variables from the .env file!
load_dotenv()

class SchedulingState(TypedDict):
    patient_id: int
    preferred_department: str
    preferred_date: str
    preferred_time: str
    recommended_doctor_id: Optional[int]
    appointment_status: str
    agent_reasoning: str

# Change this line inside app/agents/severity_agent.py
# Update this line inside app/agents/severity_agent.py
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.1)

def find_slots_node(state: SchedulingState) -> SchedulingState:
    available_doctors = check_doctor_availability(state["preferred_department"])
    if isinstance(available_doctors, str):
        return {**state, "appointment_status": "Failed", "agent_reasoning": available_doctors}
    
    prompt = f"""
    You are an AI Hospital Scheduling Coordinator. 
    A patient wants an appointment in the '{state['preferred_department']}' department on {state['preferred_date']} around {state['preferred_time']}.
    Here are the available doctors and their operational hours: {json.dumps(available_doctors)}
    Pick the best matching doctor. Output strictly a minified JSON object with keys "doctor_id" and "reasoning".
    """
    response = llm.invoke(prompt)
    clean_content = response.content.replace("```json", "").replace("```", "").strip()
    data = json.loads(clean_content)
    
    return {**state, "recommended_doctor_id": data["doctor_id"], "agent_reasoning": data["reasoning"]}

def execution_booking_node(state: SchedulingState) -> SchedulingState:
    if state["appointment_status"] == "Failed" or not state["recommended_doctor_id"]:
        return state
    result_message = book_appointment_slot(
        patient_id=state["patient_id"], doctor_id=state["recommended_doctor_id"],
        date_str=state["preferred_date"], time_str=state["preferred_time"]
    )
    status = "Confirmed" if "Success" in result_message else "Failed"
    return {**state, "appointment_status": status, "agent_reasoning": f"{state['agent_reasoning']} | {result_message}"}

scheduling_workflow = StateGraph(SchedulingState)
scheduling_workflow.add_node("find_slots", find_slots_node)
scheduling_workflow.add_node("execute_booking", execution_booking_node)
scheduling_workflow.set_entry_point("find_slots")
scheduling_workflow.add_edge("find_slots", "execute_booking")
scheduling_workflow.add_edge("execute_booking", END)
scheduling_agent = scheduling_workflow.compile()