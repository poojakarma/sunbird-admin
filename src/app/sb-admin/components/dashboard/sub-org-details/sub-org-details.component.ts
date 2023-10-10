import { Component, OnDestroy } from '@angular/core';
import { SubOrganizationDetail, SearchSubOrgFilterValue } from '../../../interfaces/OrganizationDetail';
import { Subscription, map } from 'rxjs';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { OrganizationListService } from 'src/app/sb-admin/service/organization-list.service';
import { UserService } from 'src/app/sb-admin/service/user.service';
import { MessageService } from 'primeng/api';
import { I18NextPipe } from 'angular-i18next';

@Component({
  selector: 'app-sub-org-details',
  templateUrl: './sub-org-details.component.html'
})
export class SubOrgDetailsComponent implements OnDestroy {
  data: any;
  rootOrg: any;
  subOrgDetails: SubOrganizationDetail[] = [];
  loading: boolean = true;
  first: number = 0;
  rows: number = 10;
  limit_size: number = 10;
  filteredValue = SearchSubOrgFilterValue;
  rowsPerPageOptions: number[] = [10, 20, 30];
  timeout: any = null;
  SuborgCount: number = 0;
  private subscription!: Subscription;

  constructor(public ref: DynamicDialogRef,
    public dialogConfig: DynamicDialogConfig,
    private organizationListService: OrganizationListService,
    private userService: UserService,
    private messageService: MessageService,
    private i18nextPipe: I18NextPipe
  ) {
    this.data = this.dialogConfig.data;
    this.rootOrg = this.data.rootOrg;
  }

  loadSubOrgandUserCount(event: any) {
    this.subscription = this.getSubOrgDetail(event).subscribe((subOrgData: any) => {
      if (subOrgData && subOrgData.length > 0) {
        this.getSubOrgUserCount(subOrgData);
        this.loading = false;
      }
    },
      (error: any) => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: this.i18nextPipe.transform('SUB_ORGANIZATION_ERROR') })
      }
    )
  }

  getSubOrgDetail(event: any) {
    this.filteredValue.channel = this.rootOrg.channel;
    let filtersValue = this.filteredValue;
    Object.keys(filtersValue).forEach(key => {
      if (!filtersValue[key]) {
        delete filtersValue[key]
      }
    });
    let offset = event.first
    offset = isNaN(offset) ? 0 : offset;
    const body = {
      request: {
        filters: {
          ...this.filteredValue,
          isRootOrg: false,
          isTenant: false,
        },
        limit: event?.rows || this.limit_size,
        offset: offset,
      }
    }
    return this.organizationListService.getAllOrgSubOrg(body).pipe(
      map((suborg: any) => {
        this.SuborgCount = suborg?.result?.response?.count;
        this.subOrgDetails = suborg?.result?.response?.content;
        return this.subOrgDetails;
      })
    )
  }

  onSearch(event: any): void {
    let $this = this;
    this.first = 0
    if (event.target.value.length > 3) {
      clearTimeout(this.timeout);
      this.timeout = setTimeout(function () {
        $this.loadSubOrgandUserCount(event);
      }, 2000);
    }
    else if (event.target.value.length === 0) {
      clearTimeout(this.timeout);
      this.timeout = setTimeout(function () {
        $this.loadSubOrgandUserCount(event);
      }, 1000);
    }
  }

  getSubOrgUserCount(subOrgData: any): void {
    let serverError = false;
    subOrgData.map((subOrg: any) => {
      const body = {
        "request": {
          "filters": {
            "organisations.organisationId": subOrg.id
          }
        }
      }
      this.subscription = this.userService.loadUserList(body).subscribe((userCount: any) => {
        subOrg.userCount = userCount?.result?.response?.count;
      },
        (error: any) => {
          if (!serverError) {
            serverError = true;
            this.loading = false;
            this.messageService.add({ severity: 'error', summary: error?.error?.params?.errmsg })
          }
        }
      )
    })
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

}
