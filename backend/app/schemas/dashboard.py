from pydantic import BaseModel


class DashboardKPI(BaseModel):
    totalClients: int
    activeProjects: int
    monthlyRevenue: float
    pendingInvoices: int


class RevenuePoint(BaseModel):
    month: str
    revenue: float


class ProjectStatusPoint(BaseModel):
    name: str
    value: int


class ClientGrowthPoint(BaseModel):
    month: str
    clients: int


class ActivityItem(BaseModel):
    id: int
    message: str
    timestamp: str
    action: str


class ReminderItem(BaseModel):
    id: int
    title: str
    dateLimite: str | None = None
    priorite: str
    statut: str


class MonitoringSummary(BaseModel):
    totalServices: int
    healthy: int
    warning: int
    critical: int


class DashboardOverview(BaseModel):
    kpis: DashboardKPI
    revenueData: list[RevenuePoint]
    projectStatusData: list[ProjectStatusPoint]
    clientGrowthData: list[ClientGrowthPoint]
    activities: list[ActivityItem]
    reminders: list[ReminderItem]
    monitoring: MonitoringSummary
