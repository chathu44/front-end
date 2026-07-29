import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface PrivilegeGroup {
  id?: number;
  groupName: string;
  groupDescription?: string;
  status?: number;
}

export interface SystemPrivilege {
  id: number;
  description: string;
}

export interface SystemPrivilegeList {
  sourcePrivileges: SystemPrivilege[];
  targetPrivileges: SystemPrivilege[];
}

export interface CommonDataItem {
  id: number;
  description: string;
}

export interface CommonDataList {
  addedData: CommonDataItem[];
  removedData: CommonDataItem[];
}

@Injectable({
  providedIn: 'root'
})
export class PrivilegeService {

  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getSystemPrivileges(): Observable<SystemPrivilegeList> {
    return this.http.get<SystemPrivilegeList>(`${this.baseUrl}/system-privileges`);
  }

  saveSystemPrivileges(payload: SystemPrivilegeList): Observable<SystemPrivilegeList> {
    return this.http.put<SystemPrivilegeList>(`${this.baseUrl}/system-privileges`, payload);
  }

  getPrivilegeGroups(): Observable<PrivilegeGroup[]> {
    return this.http.get<PrivilegeGroup[]>(`${this.baseUrl}/privilege-groups`);
  }

  createPrivilegeGroup(group: PrivilegeGroup): Observable<PrivilegeGroup> {
    return this.http.post<PrivilegeGroup>(`${this.baseUrl}/privilege-groups`, group);
  }

  updatePrivilegeGroup(id: number, group: PrivilegeGroup): Observable<PrivilegeGroup> {
    return this.http.put<PrivilegeGroup>(`${this.baseUrl}/privilege-groups/${id}`, group);
  }

  deletePrivilegeGroup(id: number): Observable<PrivilegeGroup> {
    return this.http.delete<PrivilegeGroup>(`${this.baseUrl}/privilege-groups/${id}`);
  }

  getAvailablePrivileges(groupId: number): Observable<CommonDataItem[]> {
    return this.http.get<CommonDataItem[]>(`${this.baseUrl}/common-data-service/available-privileges/${groupId}`);
  }

  getAssignedPrivileges(groupId: number): Observable<CommonDataItem[]> {
    return this.http.get<CommonDataItem[]>(`${this.baseUrl}/common-data-service/assigned-privileges/${groupId}`);
  }

  saveGroupPrivileges(groupId: number, payload: CommonDataList): Observable<CommonDataList> {
    return this.http.post<CommonDataList>(`${this.baseUrl}/common-data-service/group-privileges/${groupId}`, payload);
  }

  getAvailableUsers(groupId: number): Observable<CommonDataItem[]> {
    return this.http.get<CommonDataItem[]>(`${this.baseUrl}/common-data-service/group-available-users/${groupId}`);
  }

  getAssignedUsers(groupId: number): Observable<CommonDataItem[]> {
    return this.http.get<CommonDataItem[]>(`${this.baseUrl}/common-data-service/group-assigned-users/${groupId}`);
  }

  saveGroupUsers(groupId: number, payload: CommonDataList): Observable<CommonDataList> {
    return this.http.post<CommonDataList>(`${this.baseUrl}/common-data-service/privilege-group-users/${groupId}`, payload);
  }
}
