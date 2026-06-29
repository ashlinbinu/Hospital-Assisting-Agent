from typing import TypedDict
from langgraph.graph import StateGraph, END
from app.database import SessionLocal
import app.models as models

# Define the local memory state for the queue modification graph
class QueueState(TypedDict):
    patient_id: int
    doctor_id: int
    priority_level: str
    priority_score: int
    status_message: str

def insert_and_reorder_queue_node(state: QueueState) -> QueueState:
    """Inserts the patient into the database and dynamically recalculates everyone's position."""
    db = SessionLocal()
    try:
        # 1. Check if the patient is already standing in the queue
        existing_entry = db.query(models.Queue).filter(models.Queue.patient_id == state['patient_id']).first()
        
        if existing_entry:
            # If they exist, update their triage metrics
            existing_entry.priority_tier = state['priority_level']
            existing_entry.priority_score = state['priority_score']
            existing_entry.doctor_id = state['doctor_id']
        else:
            # If they don't, create a fresh entry with a placeholder position
            new_entry = models.Queue(
                patient_id=state['patient_id'],
                doctor_id=state['doctor_id'],
                current_position=999,  # Placeholder before dynamic ranking
                priority_tier=state['priority_level'],
                priority_score=state['priority_score']
            )
            db.add(new_entry)
        
        db.flush()  # Sync changes to the transaction state without committing yet

        # 2. THE LOGISTICS ENGINE: Fetch all active patients for this doctor sorted by priority score
        # Highest score goes first. If scores tie, the person who checked in earliest (checked_in_at) wins.
        ordered_list = db.query(models.Queue)\
                         .filter(models.Queue.doctor_id == state['doctor_id'])\
                         .order_by(models.Queue.priority_score.desc(), models.Queue.checked_in_at.asc())\
                         .all()
        
        # 3. Rewrite positions sequentially (1, 2, 3...) based on the new prioritized sort order
        for index, record in enumerate(ordered_list):
            record.current_position = index + 1
            
        db.commit()
        
        # Find where our specific patient ended up after the recalculation
        final_pos = db.query(models.Queue.current_position).filter(models.Queue.patient_id == state['patient_id']).scalar()
        msg = f"Queue dynamically optimized. Patient #{state['patient_id']} is now placed at position #{final_pos}."
        
    except Exception as e:
        db.rollback()
        msg = f"Queue reordering pipeline failed: {str(e)}"
    finally:
        db.close()
        
    return {**state, "status_message": msg}

# Assemble the structural LangGraph state configuration
workflow = StateGraph(QueueState)
workflow.add_node("optimize_queue", insert_and_reorder_queue_node)
workflow.set_entry_point("optimize_queue")
workflow.add_edge("optimize_queue", END)

queue_agent = workflow.compile()