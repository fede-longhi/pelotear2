export type GroupRole = "admin" | "member";
export type MatchStatus = "programado" | "jugado" | "cancelado";
export type Attendance = "pending" | "confirmed" | "declined";
export type TeamSide = "A" | "B";

export type UserRow = {
  id: string;
  email: string;
  name: string;
  first_name: string;
  last_name: string;
  nickname: string;
  phone: string;
  birth_date: string | null;
  photo_url: string;
  password_hash: string | null;
  email_verified_at: string | null;
  is_guest: boolean;
};

export type GroupRow = {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
};

export type MemberRow = {
  group_id: string;
  user_id: string;
  role: GroupRole;
  joined_at: string;
  name: string;
  email: string;
  nickname: string;
  photo_url: string;
  is_guest: boolean;
};

export type MatchRow = {
  id: string;
  group_id: string;
  played_on: string;
  kickoff_time: string;
  location: string;
  status: MatchStatus;
  goals_a: number | null;
  goals_b: number | null;
  created_by: string;
  created_at: string;
};

export type MatchPlayerRow = {
  match_id: string;
  user_id: string;
  team: TeamSide | null;
  attendance: Attendance;
  name: string;
  email: string;
  nickname: string;
  photo_url: string;
  is_guest: boolean;
};

export type PlayerStats = {
  user_id: string;
  name: string;
  wins: number;
  losses: number;
  draws: number;
  played: number;
  is_guest?: boolean;
};
