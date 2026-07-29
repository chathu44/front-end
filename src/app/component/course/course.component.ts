import { Component } from '@angular/core';
import { CourseService } from '../services/api/course/course.service';
import { FormBuilder } from '@angular/forms';
import { CourseRepresentation } from '../services/api/module/course-representation';
import swal from 'sweetalert';
import { PrivilegeService } from '../services/api/privilege/privilege.service';
import { UserAuthService } from '../services/api/user/user-auth.service';

@Component({
  selector: 'app-course',
  templateUrl: './course.component.html',
  styleUrls: ['./course.component.scss']
})
export class CourseComponent {

  deleteValue:string;
  editValue:string;
  insertValue:string;
  selectValue:string;

  updateBtn:boolean=false;

  index:any;
  type:string;
  roleName:any;
  allAccess:any;
  moduleId:string;
  courses: Array<any> = [];
  isEditCourse:boolean=false;
  roleNameForPrivilege:Array<any>=[];
  courseObj:CourseRepresentation = {};

  constructor(
    private courseService:CourseService,
    private privilegeService:PrivilegeService,
    private userAuthService:UserAuthService,
    public fb:FormBuilder
  ){}

  ngOnInit(): void {
    this.isEditCourse == false;
    this.GetAllCourses();
    this.getprivilegeforComponent();
}

getprivilegeforComponent(): void {
    // Spring Boot template uses numeric auth IDs (from /get-auth-ids/{userId}),
    // not role/module privilege flags. Enable CRUD UI when user has any auth IDs.
    const authIds = this.userAuthService.getAuthIds();
    const canManage = authIds.length > 0 || this.userAuthService.isLoggedIn();

    this.deleteValue = canManage ? '1' : '0';
    this.editValue = canManage ? '1' : '0';
    this.insertValue = canManage ? '1' : '0';
    this.selectValue = canManage ? '1' : '0';
    this.buttonDisable(this.deleteValue, this.editValue, this.insertValue, this.selectValue);
  }

buttonDisable(deleteValue:string,editValue:string,insertValue:string,selectValue:string){
console.log(editValue);

    if(editValue=="0"){
      this.updateBtn=true;
    }else{
      this.updateBtn=false;
    }

}

SaveCourse():void{
  this.type = this.isEditCourse==false?'Add':'Update';
    if(this.type=='Add'){
      swal({
        title: "Are you sure?",
        text: "That you want to Add this details?",
        icon: "warning",
        dangerMode: true,
      })
      .then(willDelete => {
        if (willDelete) {
          this.courseService.createCourse(this.courseObj,this.type)
          .subscribe({
            next:(result):void=>{
              this.GetAllCourses();  
            }
          });
          swal("Sucessfull!", "Course has been Adedd!", "success");
        }
       
      });
    }else{
      console.log(this.courseObj);
      
      this.courseService.createCourse(this.courseObj,this.type)
          .subscribe({
            next:(result):void=>{
              this.GetAllCourses();  
            }
          });
      swal("Sucessfull!", "Course has been updated!", "success");

  
    }
}

GetCourseById(ID:any){
  this.courseService.GetCourseById(ID).subscribe(allData=>{ 
    this.courseObj = allData.data.dataList[0];
    this.isEditCourse = true;
  })
}

DeleteById(ID:any){
  swal({
    title: "Are you sure",
    text: "That you want to Delete this Course?",
    icon: "warning",
    dangerMode: true,
  })
  .then(willDelete => {
    if (willDelete) {
      swal("Deleted!", "Course has been deleted!", "success");
      this.courseService.DeleteCourseById(ID).subscribe(allData=>{
        this.GetAllCourses();
      })
    }
  });
}

GetAllCourses(){
  this.courseService.GetAllCourses().subscribe(allData=>{
    this.courses = allData.data.dataList; 
  });
}

}
