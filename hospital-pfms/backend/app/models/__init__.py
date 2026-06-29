from app.database import Base
from .patient import Patient
from .doctor import Doctor
from .appointment import Appointment
from .queue import Queue
from .wait_history import WaitHistory

# This makes it easy to import everything at once elsewhere
__all__ = ["Base", "Patient", "Doctor", "Appointment", "Queue", "WaitHistory"]