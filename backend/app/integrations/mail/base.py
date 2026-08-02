from abc import ABC, abstractmethod


class MailTransport(ABC):
    @abstractmethod
    def send(self, to_email: str, subject: str, body_text: str) -> None: ...
