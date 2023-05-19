import { Component, OnDestroy, ViewChild } from '@angular/core';
import { OrganizationDetail } from './OrganizationDetail';
import { OrganizationListService } from 'src/app/sb-admin/service/organization-list.service';
import { Subscription } from 'rxjs';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AddOrEditOrgComponent } from './add-or-edit-org/add-or-edit-org.component';


@Component({
  selector: 'app-sb-organization',
  templateUrl: './sb-organization.component.html',
  styleUrls: ['./sb-organization.component.scss']
})
export class SbOrganizationComponent implements OnDestroy {


  organizationDetail: OrganizationDetail[] = [];

  loading: boolean = true;

  private subscription: Subscription | any;

  ref:any;

  constructor(private orgList: OrganizationListService, public dialogService: DialogService) { }

  ngOnInit() {
    this.getAllOrganizationList();
  }

  //Get all Organization  data
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
      this.loading = false;
    },
    (error:any)=>{
      console.log(error);
      this.loading = false;
    }
    );
  }


  addOrg(){
    this.ref = this.dialogService.open(AddOrEditOrgComponent, { 
      header: 'Add Organization',
      width: '40%',
      contentStyle: { 
        overflow: 'auto'
      },
      baseZIndex: 10000
    });
  }


  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}


