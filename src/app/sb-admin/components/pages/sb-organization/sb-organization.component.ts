import { Component, OnDestroy } from '@angular/core';
import { OrganizationDetail } from './OrganizationDetail';
import { OrganizationListService } from 'src/app/sb-admin/service/organization-list.service';
import { Subscription } from 'rxjs';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AddOrEditOrgComponent } from './add-or-edit-org/add-or-edit-org.component';
import { MessageService, Message } from 'primeng/api';
import { I18NextPipe } from 'angular-i18next';
import { UserService } from 'src/app/sb-admin/service/user.service';

@Component({
  selector: 'app-sb-organization',
  templateUrl: './sb-organization.component.html',
  styleUrls: ['./sb-organization.component.scss']
})
export class SbOrganizationComponent implements OnDestroy {

  organizationDetail: OrganizationDetail[] = [];
  loading: boolean = true;
  private subscription: Subscription | any;
  globalFilterFields :string []=['organizationName','channel','id'];
  rows:number=10;
  orgCount :number=0;
  userCount : number=0;
  messages: Message[] = [];
  addOrgDialog = {
    header: this.i18nextPipe.transform('ADD_ORGANIZATION'),
    width: '40%',
    contentStyle: {
      overflow: 'auto'
    }
  };

  constructor(private orgList: OrganizationListService,private userService: UserService,public dialogService: DialogService, public ref: DynamicDialogRef, private messageService: MessageService,private i18nextPipe: I18NextPipe) { }
  ngOnInit() {
    this.getAllOrganizationList();
    this.getTotalUserCount();
  }

  getAllOrganizationList() {
    const body = {
      "request": {
        "filters": {
          "isRootOrg": true
        }
      }
    }
    this.subscription = this.orgList.getAllOrganizationList(body).subscribe(
      (data: any) => {
        this.organizationDetail = data.result.response.content;
        this.orgCount=this.organizationDetail.length;
        this.organizationDetail.sort((startDate:any ,endDate :any)=>
          new Date(endDate.createdDate).getTime() - new Date(startDate.createdDate).getTime());
        this.loading = false;
      },
      (error: any) => {
        console.log(error);
        this.loading = false;
      }
    );
  }

  addOrg() {
    this.ref = this.dialogService.open(AddOrEditOrgComponent, this.addOrgDialog);
    this.ref.onClose.subscribe((newOrganizationData: any) => {
      if (newOrganizationData) {
        this.organizationDetail.unshift(newOrganizationData);
        this.orgCount=this.organizationDetail.length;
        this.messageService.add({ severity: 'success', summary: this.i18nextPipe.transform('ADD_ORGANIZATION_SUCCESSFULLY')})
      }
    });
  }
 
  getTotalUserCount(){
    const body={
        "request": {
            "filters": {
            }
        }
    }
    this.userService.loadUserList(body).subscribe((response:any) => {
      this.userCount = response.result.response.count;
    }) 
  }
   
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}


