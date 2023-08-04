import { Component, OnDestroy } from '@angular/core';
import { OrganizationDetail, UserRoles, SearchFilterValue, SubOrganizationDetail } from './OrganizationDetail';
import { OrganizationListService } from 'src/app/sb-admin/service/organization-list.service';
import { Subscription, map, Observable } from 'rxjs';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AddOrEditOrgComponent } from './add-or-edit-org/add-or-edit-org.component';
import { MessageService } from 'primeng/api';
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
  first: number = 0;
  filteredValue = SearchFilterValue;
  rowsPerPageOptions: number[] = [10, 20, 30];
  timeout: any = null;
  userRoles!: UserRoles[];
  orgRoles: any
  userTypeVisible: boolean = false;
  subOrgDetailsVisible: boolean = false;
  subOrgDetails: SubOrganizationDetail[] = [];
  rootOrgDetail: any;

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
    this.subscription = this.getAllOrg(event).subscribe((data: any) => {
      this.organizationDetail = data;
      if (data && data.length > 0) {
        this.getSubOrgCountOfEachOrg(data);
        this.getUserCountOfEachOrg(data);
      } else {
        this.loading = false;
      }
    },
      (error: any) => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: "Oops! Something went wrong. Please try again later" })
        console.log(error);
      }
    );
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
      this.subscription = this.orgList.getAllOrgSubOrg(body).subscribe((subOrgCount: any) => {
        org.subOrgCount = subOrgCount.result.response.count;
      })
    },
      (error: any) => {
        console.log(error)
        this.loading = false;
      })
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
      this.subscription = this.userCountService.getUserCountOfaTenant(body).subscribe(
        (counttenant: any) => {
          org.userCount = counttenant?.result?.response?.count;
          if (orgDetail[orgDetail.length - 1].id === org.id) {
            this.loading = false;
          }
        },
        (error: any) => {
          this.loading = false
          console.log('error', error);
        }
      );
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
    this.subscription = this.orgList.getAllOrgSubOrg(body).subscribe((response: any) => {
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
    this.subscription = this.userService.loadUserList(body).subscribe((response: any) => {
      this.TotaluserCount = response.result.response.count;
    },
      (error: any) => {
        this.messageService.add({ severity: 'error', summary: error?.error?.params?.errmsg })
        console.log(error);
      }
    )
  }

  getAllUserTypeandCount(organization: any) {
    this.userTypeVisible = true;
    this.subOrgDetailsVisible = false;
    this.orgRoles = organization;
    this.loading = true
    this.subscription = this.getAllUserType(organization).subscribe(
      (data: any) => {
        if (data) {
          this.getAllUserTypeCount(data, organization.id);
          this.loading = false;
        }
      },
      (error: any) => {
        console.error(error);
        this.loading = false
      }
    );
  }

  getAllUserType(organization: any): Observable<any> {
    const id = organization.id;
    const body = {
      "request": {
        "type": "config",
        "action": "get",
        "subType": "userType",
        "id": id,
        "component": "portal"
      }
    };
    return this.userService.getAllUserRoles(body).pipe(
      map((response: any) => {
        this.userRoles = response.result.form.data?.fields;
        return this.userRoles;
      })
    );
  }

  getAllUserTypeCount(userTypes: any, id: any) {
    let errorOccured = false;
    userTypes.map((org: any) => {
      const body = {
        "request": {
          "filters": {
            "rootOrgId": id,
            "userType": org.name
          }
        }
      }
      this.subscription = this.orgList.getUserTypeCount(body).subscribe((data: any) => {
        org.userTypeCount = data.result.response.count;
        this.loading = false
      },
        (error: any) => {
          if (!errorOccured) {
            errorOccured = true;
            this.messageService.add({ severity: 'error', summary: error?.error?.params?.errmsg })
          }
        }
      )
    })
  }

  getSubOrgDetail(rootOrg: any) {
    this.rootOrgDetail = rootOrg;
    this.subOrgDetailsVisible = true;
    this.userTypeVisible = false;
    const body = {
      "request": {
        "filters": {
          "isRootOrg": false,
          "isTenant": false,
          "channel": rootOrg.channel
        }
      }
    }
    this.orgList.getAllOrgSubOrg(body).subscribe((suborg: any) => {
      this.subOrgDetails = suborg.result.response.content;
      console.log(this.subOrgDetails);

    })
    console.log("suborgdetail", rootOrg);
  }

  addOrg() {
    this.ref = this.dialogService.open(AddOrEditOrgComponent,
      {
        header: this.i18nextPipe.transform('ADD_ORGANIZATION'),
        data: { mode: 'Add' },
        width: '40%',
        contentStyle: {
          overflow: 'auto'
        }
      }
    );
    this.ref.onClose.subscribe((newOrganizationData: any) => {
      if (newOrganizationData) {
        this.organizationDetail.unshift(newOrganizationData);
        this.orgCount = this.organizationDetail.length;
        this.messageService.add({ severity: 'success', summary: this.i18nextPipe.transform('ADD_ORGANIZATION_SUCCESSFULLY') })
      }
    });
  }

  editOrganization(organization: any) {
    this.ref = this.dialogService.open(AddOrEditOrgComponent, {
      data: { mode: 'Edit', organization },
      width: '40%',
      header: 'Edit Organization'
    });
    this.ref.onClose.subscribe((updatedData: any) => {
      if (updatedData) {
        this.messageService.add({
          severity: 'success', summary: this.i18nextPipe.transform('EDIT_ORGANIZATION_UPDATE_STATUS')
        })
        const index = this.organizationDetail.findIndex((org) => org.id === updatedData.organisationId);
        if (index !== -1) {
          this.organizationDetail[index].orgName = updatedData.orgName;
          this.organizationDetail[index].description = updatedData.description
        }
      }
    })
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


