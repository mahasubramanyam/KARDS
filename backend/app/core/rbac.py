from enum import StrEnum

from app.core.exceptions import ForbiddenError


class Role(StrEnum):
    VOLUNTEER = "volunteer"
    NGO = "ngo"
    COMPANY = "company"
    ADMIN = "admin"


class Permission(StrEnum):
    MANAGE_PLATFORM = "platform.manage"
    MANAGE_VERIFICATION = "verification.manage"
    MANAGE_DISPUTES = "disputes.manage"
    MANAGE_API_KEYS = "api_keys.manage"
    VIEW_AUDIT = "audit.view"

    VERIFY_NGO = "ngo.verify"
    MANAGE_OWN_NGO = "ngo.manage_own"
    VIEW_ALL_NGOS = "ngo.view_all"

    MANAGE_OWN_COMPANY = "company.manage_own"
    CREATE_PROJECT = "project.create"
    MANAGE_OWN_PROJECT = "project.manage_own"
    VIEW_ALL_PROJECTS = "project.view_all"

    MANAGE_OWN_OPPORTUNITY = "opportunity.manage_own"
    APPLY_TO_OPPORTUNITY = "opportunity.apply"
    MANAGE_OWN_APPLICATION = "application.manage_own"

    LOG_OWN_HOURS = "hours.log_own"
    APPROVE_HOURS = "hours.approve"
    VIEW_REPORTS = "reports.view"
    GENERATE_REPORTS = "reports.generate"

    USE_PARTNER_API = "partner.use"

    MESSAGE = "message.send"


ROLE_PERMISSIONS: dict[Role, set[Permission]] = {
    Role.ADMIN: set(Permission),
    Role.VOLUNTEER: {
        Permission.APPLY_TO_OPPORTUNITY,
        Permission.MANAGE_OWN_APPLICATION,
        Permission.LOG_OWN_HOURS,
        Permission.MESSAGE,
        Permission.VIEW_ALL_PROJECTS,
    },
    Role.NGO: {
        Permission.MANAGE_OWN_NGO,
        Permission.MANAGE_OWN_OPPORTUNITY,
        Permission.APPROVE_HOURS,
        Permission.MANAGE_OWN_APPLICATION,
        Permission.GENERATE_REPORTS,
        Permission.MESSAGE,
        Permission.VIEW_ALL_PROJECTS,
    },
    Role.COMPANY: {
        Permission.MANAGE_OWN_COMPANY,
        Permission.CREATE_PROJECT,
        Permission.MANAGE_OWN_PROJECT,
        Permission.VIEW_REPORTS,
        Permission.GENERATE_REPORTS,
        Permission.MESSAGE,
        Permission.VIEW_ALL_PROJECTS,
    },
}


def require(role: Role, permission: Permission) -> None:
    if permission not in ROLE_PERMISSIONS.get(role, set()):
        raise ForbiddenError(message=f"Missing required permission: {permission}")
