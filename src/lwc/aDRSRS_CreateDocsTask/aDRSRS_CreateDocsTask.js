/* eslint-disable vars-on-top */
/* eslint-disable guard-for-in */
/* eslint-disable no-console */
import { LightningElement, track,api,wire} from 'lwc';
import { createRecord } from 'lightning/uiRecordApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import CurrentUserId from '@salesforce/user/Id';
import CASE_OBJECT from '@salesforce/schema/Case';
export default class ADRSRS_CreateDocsTask extends LightningElement {
    @track AccountId;
    @track Subject;
    @track SubType;
    @track type;
    @track Priority;
    @track caseCreationDate;
    @track LegacyTerritory;
    @track Origin;
    @track Reason;
    @track RecordType; 
    @track CaseSubmitter;
    @track ComplaintDesc;
    @track ComplaintDate;
    @track ComplaintSummary;
    @track ContactPhone;
    @track Desc;
    @track RoutingAttr;
    @track Full_Service_Address;
    @track isEdit;
    @track options;
    @track caseid;
    @api selAddr;
    @api selPCN;
    @api isAutoAdd;
    @api autoAddError;
    @wire(getObjectInfo, { objectApiName: CASE_OBJECT })
    objectInfo({data, error}) {
        if(data) {
            const rtis = data.recordTypeInfos;
            this.RecordType = Object.keys(rtis).find(rti => rtis[rti].name === 'Blue Marble Order Error');
            //this.populateData();
        }
        else if(error) {
            window.console.log('Error ===> '+JSON.stringify(error));
        }
    }

    get recordTypeId() {
        const rtis = this.objectInfo.data.recordTypeInfos;
        console.log("Record type id--"+Object.keys(rtis).find(rti => rtis[rti].name === 'Blue Marble Error Fallout'));
        return Object.keys(rtis).find(rti => rtis[rti].name === 'Blue Marble Error Fallout');
    }
    connectedCallback() {
        console.log("---addr--"+this.selAddr);
        console.log("---ph no--"+this.selPCN);
        console.log("---autoadd--"+this.isAutoAdd);
        console.log("---error--"+this.autoAddError);
        
        if(this.isAutoAdd){
            this.Subject = 'Auto Add is Un-Successful';
            this.type = 'ASSN_ADRSRS';
        }
        else{
            this.Subject = 'Auto Add Not Supported';
            this.type = 'E911_ADRSRS';
        }
        this.Priority = 'High';
        this.Full_Service_Address = this.selAddr;
        this.Origin = 'Phone'; 
        this.Reason = 'Service Address Not Found';
        this.CaseSubmitter = CurrentUserId;
        this.ComplaintDesc = 'Service Address not found in the Address Management system. Please add the address into the Database.';
        this.ContactPhone = this.selPCN;
        this.Desc = this.Subject+' : '+this.autoAddError;
        
        this.isEdit= true;
    }
    handleClick(event) {
        var buttonClickedLabel = event.target.label;
        //var close=true;
        var fields = {};
        console.log("inside the handle click"+buttonClickedLabel);
        //this.RecordType = this.recordTypeId;
        if(buttonClickedLabel==='Save'){
            fields= {
                'Subject' : this.Subject,
                'Type':this.type,
                'SubType__c':this.type,
                'Priority' : this.Priority,
                'Case_Creation_Date__c':this.caseCreationDate,
                'Origin': this.Origin,
                'Reason': this.Reason,
                'RecordTypeId':this.RecordType,
                'Case_Submitter__c':this.CaseSubmitter,
                'Complaint_Description__c':this.ComplaintDesc,
                'Complaint_Summary__c':this.ComplaintSummary,
                'Full_Service_Address__c':this.Full_Service_Address,
                'Telephone_Number__c':this.ContactPhone,
                'Description':this.Desc
                //'Service_Street_Number__c':
                //'Service_Street_Name__c'
                //'Service_City__c'
                //'Service_State__c'
                //'Service_Country__c'
                //'Service_Postal_Code__c'
            }
            const recordInput = { apiName: CASE_OBJECT.objectApiName, fields };
            createRecord(recordInput)
            .then(caserec => {
                console.log("inside the After save"+caserec);
                this.caseid = caserec.id;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Case created',
                        variant: 'success',
                    }),
                );
                this.isEdit = false;
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error creating record',
                        message: error.body.message,
                        variant: 'error',
                    }),
                );
            });
            
        }
        else{
            const closeClickEvent = new CustomEvent("oncloseClicked", {
            });
            this.dispatchEvent(closeClickEvent);
            /*const evt = new ShowToastEvent({
                title: "Error",
                message: "Cancelled",
                variant: "error",
            });
            this.dispatchEvent(evt);*/
        } 
    }
}