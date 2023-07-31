import { Component, OnDestroy } from '@angular/core';
import { OrganizationDetail, SearchFilterValue } from './OrganizationDetail';
import { OrganizationListService } from 'src/app/sb-admin/service/organization-list.service';
import { Subscription, map } from 'rxjs';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AddOrEditOrgComponent } from './add-or-edit-org/add-or-edit-org.component';
import { MessageService, Message } from 'primeng/api';
import { I18NextPipe } from 'angular-i18next';
import { UserService } from 'src/app/sb-admin/service/user.service';
import { UserCountService } from 'src/app/sb-admin/service/user-count.service';
import { AddSubOrgComponent } from './add-sub-org/add-sub-org.component';

@Component({
  selector: 'app-sb-organization',
  templateUrl: './sb-organization.component.html',
  styleUrls: ['./sb-organization.component.scss']
})

export class SbOrganizationComponent implements OnDestroy {
  organizationDetail: OrganizationDetail[] = [];
  loading: boolean = true;
  private subscription!: Subscription;
  rows: number = 10;
  orgCount: number = 0;
  TotaluserCount: number = 0;
  TotalsubOrgCount: number = 0;
  messages: Message[] = [];
  first: number = 0;
  filteredValue = SearchFilterValue;
  rowsPerPageOptions: number[] = [10, 20, 30];
  timeout: any = null;
  addOrgDialog = {
    header: this.i18nextPipe.transform('ADD_ORGANIZATION'),
    width: '40%',
    contentStyle: {
      overflow: 'auto'
    }
  };
  addSubOrgDialog = {
    header: this.i18nextPipe.transform('ADD_SUB_ORGANIZATION'),
    width: '40%',
    contentStyle: {
      overflow: 'auto'
    }
  };

  constructor(private orgList: OrganizationListService, private userService: UserService,
    private userCountService: UserCountService, public dialogService: DialogService,
    public ref: DynamicDialogRef, private messageService: MessageService, private i18nextPipe: I18NextPipe) { }

  ngOnInit() {
    this.getTotalOrgCount();
    this.getTotalUserCount();
    this.getTotalSubOrgCount();
  }

  loadOrganizationData(event: any) {
    this.loading = true;
    this.getAllOrg(event).subscribe((data: any) => {
      this.organizationDetail = data;
      if (data && data.length > 0) {
        this.getSubOrgCountOfEachOrg(data);
        this.getUserCountOfEachOrg(data);
      } else {
        this.loading = false;
      }
    });
  }

  getAllOrg(event: any) {
    let filters = this.filteredValue;
    Object.keys(filters).forEach(key => {
      if (!filters[key]) {
        delete filters[key]
      }
    });
    let offset = event.first
    offset = isNaN(offset) ? 0 : offset;
    const body = {
      request: {
        filters: filters,
        limit: event?.rows || 10,
        offset: offset,
      }
    }
    return this.orgList.getAllOrgSubOrg(body).pipe(
      map((data: any) => {
        this.organizationDetail = data.result.response.content;
        this.organizationDetail.sort((startDate: any, endDate: any) =>
          new Date(endDate.createdDate).getTime() - new Date(startDate.createdDate).getTime());
        return this.organizationDetail;
      },
        (error: any) => {
          console.log(error);
          this.loading = false;
        }
      )
    );
  }

  onSearch(event: any): void {
    let $this = this;
    this.first = 0
    if (event.target.value.length > 3) {
      clearTimeout(this.timeout);
      this.timeout = setTimeout(function () {
        $this.loadOrganizationData(event);
      }, 2000);
    }
    else if (event.target.value.length === 0) {
      clearTimeout(this.timeout);
      this.timeout = setTimeout(function () {
        $this.loadOrganizationData(event);
      }, 1000);
    }
  }


  getSubOrgCountOfEachOrg(orgDetail: any) {
    orgDetail.map((org: any) => {
      const body = {
        "request": {
          "filters": {
            "isRootOrg": false,
            "isTenant": false,
            "channel": org.channel

          },
          "sortBy": {
            "createdDate": "Desc"
          }
        }
      }
      this.orgList.getAllOrgSubOrg(body).subscribe((subOrgCount: any) => {
        org.subOrgCount = subOrgCount.result.response.count;
      })
    },
      (error: any) => {
        console.log(error);
        this.loading = false;
      }
    )
  }

  getUserCountOfEachOrg(orgDetail: any): void {
    orgDetail.map((org: any) => {
      const body = {
        "request": {
          "filters": {
            "rootOrgId": org.id
          }
        }
      };
      this.userCountService.getUserCountOfaTenant(body).subscribe((counttenant: any) => {
        org.userCount = counttenant?.result?.response?.count;
        if (orgDetail[orgDetail.length - 1].id === org.id) {
          this.loading = false;
        }
      });
    },
      (error: any) => {
        console.log(error);
        this.loading = false;
      }
    );
  }

  getTotalOrgCount() {
    const body = {
      "request": {
        "filters": {
          "isRootOrg": true
        }
      }
    }
    this.subscription = this.orgList.getAllOrgSubOrg(body).subscribe(
      (data: any) => {
        this.orgCount = data.result.response.count;
      },
      (error: any) => {
        console.log(error);
      }
    );
  }

  getTotalSubOrgCount() {
    const body = {
      "request": {
        "filters": {
          "isRootOrg": false
        }
      }
    }
    this.orgList.getAllOrgSubOrg(body).subscribe((response: any) => {
      this.TotalsubOrgCount = response.result.response.count;
    },
      (error: any) => {
        console.log(error);
      }
    )
  }

  getTotalUserCount() {
    const body = {
      "request": {
        "filters": {
        }
      }
    }
    this.userService.loadUserList(body).subscribe((response: any) => {
      this.TotaluserCount = response.result.response.count;
    },
      (error: any) => {
        console.log(error);
      }
    )
  }

  addOrg() {
    this.ref = this.dialogService.open(AddOrEditOrgComponent, this.addOrgDialog);
    this.ref.onClose.subscribe((newOrganizationData: any) => {
      if (newOrganizationData) {
        this.organizationDetail.unshift(newOrganizationData);
        this.orgCount = this.organizationDetail.length;
        this.messageService.add({ severity: 'success', summary: this.i18nextPipe.transform('ADD_ORGANIZATION_SUCCESSFULLY') })
      }
    });
  }

  addSubOrg() {
    this.ref = this.dialogService.open(AddSubOrgComponent, this.addSubOrgDialog);
    this.ref.onClose.subscribe((newSubOrgData: any) => {
      if (newSubOrgData) {
        this.messageService.add({ severity: 'success', summary: this.i18nextPipe.transform('ADD_SUB_ORGANIZATION_SUCCESSFULLY') })
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

}


