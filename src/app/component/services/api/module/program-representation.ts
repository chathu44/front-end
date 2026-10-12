export interface ProgramRepresentation {
  id?: string | number;
  programCode?: string;
  programName?: string;
  description?: string;
  sessionStart?: string;
  sessionEnd?: string;
  monthlyFee?: number | null;

  status?: any;
}