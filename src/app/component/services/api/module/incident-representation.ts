export type IncidentRelationship =
  | string
  | number
  | {
      id?: string | number;
      name?: string;
      [key: string]: any;
    }
  | null;

export interface IncidentRepresentation {
  id?: string | number;
  incidentCode?: string;
  incidentDate?: string;
  incidentType?: string;
  description?: string;
  actionTaken?: string;
  parentNotified?: boolean | null;

  child?: IncidentRelationship;
  classroom?: IncidentRelationship;
  reportedBy?: IncidentRelationship;
  status?: IncidentRelationship;
}