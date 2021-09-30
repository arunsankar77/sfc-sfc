import { LightningElement,api } from 'lwc';
import queryDatabase from "@salesforce/apex/LwcUtils.queryDatabase";
import generateShortenedURL from "@salesforce/apex/SendRccChatController.generateShortenedURL";
import getQuoteInfo from "@salesforce/apex/SendRccChatController.getQuoteInfoCallout";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import styles from "@salesforce/resourceUrl/rccAcceptance";
import { loadStyle } from "lightning/platformResourceLoader";
import ConsoleApiBridge from "c/consoleApiBridge";

export default class AgentChatSendRCC extends LightningElement {
    @api recordId;
    isErrorState = false;
    acceptType = '';
    Loading = false;
    showValue = true;
    isCRISacc;
    didPreview = false;
    myVal;
    initialAccNumBlank = false;
    orderNumber;
    resp;
    formats = ['font', 'size', 'bold', 'italic', 'underline',
    'strike', 'list', 'indent', 'align', 'link',
    'image', 'clean', 'table', 'header', 'color',
    'background', 'code', 'code-block', 'script', 'blockquote', 'direction'];

    closeModal() {
        // to close modal set isModalOpen tarck value as false
        this.dispatchEvent(
            new CustomEvent("closeRCCModal")
          );
    }
    backgroundString;
    
	
    connectedCallback(){
        console.log(window.location.origin);
        loadStyle(this, styles);
        console.log(this.recordId);
        console.log('Connected Callback');
        queryDatabase({
            query:
              "SELECT Id, Status, AccountId,Account.Accountnumber, Account.PersonEmail,Account.SMS_Number__pc, Account.Billing_Source__c FROM LiveChatTranscript WHERE id = '" + 
              this.recordId +
              "'"
          }).then(resp => {
            console.log(resp);
            if(resp && resp.length ==1 && !resp[0].AccountId){
                const evt = new ShowToastEvent({
                    title: 'RCC Error',
                    message: 'Chat must be attached to an account to send RCCs',
                    variant: 'error',
                });
                this.dispatchEvent(evt);
                return;
            }
            if(resp && resp.length ==1 && resp[0].Status == 'Completed'){
                const evt = new ShowToastEvent({
                    title: 'RCC Error',
                    message: 'Chat must be active to send RCCs',
                    variant: 'error',
                });
                this.dispatchEvent(evt);
                return;
            }
            this.resp = resp[0].Account;
            if(this.resp.Billing_Source__c == 'CRIS'){
                this.isCRISacc = true;
            }
            console.log("*************** "+ this.resp.AccountNumber);
            if(!this.resp.AccountNumber){
                console.log("***************");
                this.initialAccNumBlank = true;
            }
          });
    }
    changeVal(evt){
        console.log('Changing');
        
    }
    doPreviewCall(){
         var accNum = this.template.querySelector('[data-id="accountNumberField"]');
        this.Loading = true;
        getQuoteInfo({ accountId:this.resp.Billing_Account__c, Accountnumber:accNum.value})
            .then(resp =>{
                //console.log(resp);
                if(!resp){
                    const evt = new ShowToastEvent({
                        title: 'RCC Error',
                        message: 'Error retrieving quote. Please use your standard RCCs',
                        variant: 'error',
                    });
                    this.dispatchEvent(evt);
                    this.Loading = false;
                    return;
                }
                var Obj = JSON.parse(resp);
                if(!Obj || !Obj.orderDetail){
                    const evt = new ShowToastEvent({
                        title: 'RCC Error',
                        message: 'Error retrieving quote. Please use your standard RCCs',
                        variant: 'error',
                    });
                    this.dispatchEvent(evt);
                    this.Loading = false;
                    return;
                }
                console.log(Obj);

                if(Obj && Obj.orderDetail && Obj.orderDetail.importantInfo && Obj.orderDetail.importantInfo.orderNumber ){
                    let orderString = Obj.orderDetail.importantInfo.orderNumber.split(': ');
                    if(orderString && orderString.length >1){
                        this.orderNumber = orderString[1];
                    }else if(orderString && orderString.length ==1){
                        this.orderNumber = orderString[0];
                    }
                }
                var OrderDetail = Obj.orderDetail;
                var OrderCharges = OrderDetail.charges;
                var NextMonthCharges = OrderDetail.nextMonthBill;
                var OrderChargesLength = OrderCharges.length;
                var newquoteid = OrderDetail.importantInfo.reference;
                var builtOutHTMLText = "<table  style='border-spacing: 0;border:2px solid #48d597; margin-right: auto; margin-left:auto; border-radius:10px 10px 0px 0px; padding: 10px;background: #48d597;'>";
                builtOutHTMLText += "<tr><td align='center' style='color: black;font-weight: bold;'>Account Information & Order Confirmation</td></tr></table>";
                builtOutHTMLText += "<table style='border-spacing: 0;border:2px solid #48d597; border-radius:0px 0px 10px 10px; padding: 20px;margin-left: auto;margin-right: auto;' border='0'>";
                for (var i = 0; i < OrderChargesLength; i++) {
                    var OrderChargesObj = OrderCharges[i];
                    builtOutHTMLText += "<tr><th align='left' style='border-bottom: 2px solid black;'>" + OrderChargesObj.title + "</th><th align='right' style='border-bottom: 2px solid black;'>" + (OrderChargesObj.subtotal) + "</th>";
                    var itemLenght = OrderChargesObj.items.length;
                    var OrderChargesItem = OrderChargesObj.items;
                    for (var j = 0; j < itemLenght; j++) {
                        var OrderChargesItemObj = OrderChargesItem[j];
                        if (OrderChargesItemObj.price != null && OrderChargesItemObj.price != 0) {
                            builtOutHTMLText += "<tr><td align='left' style='padding-left:2%;font-weight:bold;'>Service for : " + OrderChargesItemObj.name + "</td><td align='right' style='font-weight:bold;'>" + OrderChargesItemObj.price + "</td>";
                        } else {
                            builtOutHTMLText += "<tr><td align='left' style='padding-left:2%;font-weight:bold;'>Service for : " + OrderChargesItemObj.name + "</td><td align='right' style='font-weight:bold;'>" + '' + "</td>";
                        }
                        var OrderChargesItemSubItem = OrderChargesItemObj.subItems;
                        var OrderChargesItemObjSubItemsLength = OrderChargesItemSubItem.length;
                        for (var k = 0; k < OrderChargesItemObjSubItemsLength; k++) {
                            var OrderChargesItemSubItemObj = OrderChargesItemSubItem[k];
                            if (OrderChargesItemSubItemObj.price != null && OrderChargesItemSubItemObj.price != 0) {
                                builtOutHTMLText += "<tr><td align='left' style='padding-left:4%'>" + OrderChargesItemSubItemObj.name + "</td><td align='right'>" + OrderChargesItemSubItemObj.price + "</td>";
                            } else {
                                builtOutHTMLText += "<tr><td align='left' style='padding-left:4%'>" + OrderChargesItemSubItemObj.name + "</td><td align='right'>" + '' + "</td>";
                            }



                            var OrderChargesItemSubItemSubItem = OrderChargesItemSubItemObj.subItems;
                            if (OrderChargesItemSubItemSubItem != null) {
                                var subItemlength = OrderChargesItemSubItemSubItem.length;
                                for (var l = 0; l < subItemlength; l++) {
                                    var OrderChargesItemSubItemSubItemObj = OrderChargesItemSubItemSubItem[l];
                                    if (OrderChargesItemSubItemSubItemObj.price != null && OrderChargesItemSubItemSubItemObj.price != 0) {
                                        builtOutHTMLText += "<tr><td align='left' style='padding-left:6%;padding-bottom: 5px;'>" + OrderChargesItemSubItemSubItemObj.name + "</td><td style='padding-bottom: 5px;' align='right'>" + OrderChargesItemSubItemSubItemObj.price + "</td>";
                                    } else {
                                        builtOutHTMLText += "<tr><td align='left' style='padding-left:6%;padding-bottom: 5px;'>" + OrderChargesItemSubItemSubItemObj.name + "</td><td style='padding-bottom: 5px;' align='right'>" + '' + "</td>";
                                    }




                                }
                            }

                        }
                    }
                    builtOutHTMLText += "</tr>";
                }
                if (NextMonthCharges != null) {

                    builtOutHTMLText += "<tr><th align='left' style='border-bottom: 2px solid black;'>" + NextMonthCharges.title + "</th><th align='right' style='border-bottom: 2px solid black;'>" + (NextMonthCharges.subtotal) + "</th>";
                    var OrderChargesItem = NextMonthCharges.items;
                    var itemLenght = OrderChargesItem.length;
                    for (var j = 0; j < itemLenght; j++) {
                        var OrderChargesItemObj = OrderChargesItem[j];
                        if (OrderChargesItemObj.price != null && OrderChargesItemObj.price != 0) {
                            builtOutHTMLText += "<tr><td align='left' style='padding-left:2%;font-weight:bold;'>Service for : " + OrderChargesItemObj.name + "</td><td align='right' style='font-weight:bold;'>" + OrderChargesItemObj.price + "</td>";
                        }
                        var OrderChargesItemSubItem = OrderChargesItemObj.subItems;
                        var OrderChargesItemObjSubItemsLength = OrderChargesItemSubItem.length;
                        for (var k = 0; k < OrderChargesItemObjSubItemsLength; k++) {
                            var OrderChargesItemSubItemObj = OrderChargesItemSubItem[k];
                            if (OrderChargesItemSubItemObj.price != null &&
                                OrderChargesItemSubItemObj.price != 0) {
                                builtOutHTMLText += "<tr><td align='left' style='padding-left:4%' colspan='2'>" + OrderChargesItemSubItemObj.name + "</td><td align='right'>$" + OrderChargesItemSubItemObj.price + "</td>";
                            } else {
                                builtOutHTMLText += "<tr><td align='left' style='padding-left:4%' colspan='2'>" + OrderChargesItemSubItemObj.name + "</td>";
                            }
                            var OrderChargesItemSubItemSubItem = OrderChargesItemSubItemObj.subItems;
                            if (OrderChargesItemSubItemSubItem != null) {
                                var subItemlength = OrderChargesItemSubItemSubItem.length;
                                for (var l = 0; l < subItemlength; l++) {
                                    var OrderChargesItemSubItemSubItemObj = OrderChargesItemSubItemSubItem[l];
                                    if (OrderChargesItemSubItemSubItemObj.price != null &&
                                        OrderChargesItemSubItemSubItemObj.price != 0) {
                                        builtOutHTMLText += "<tr><td align='left' style='padding-left:6%'>" + OrderChargesItemSubItemSubItemObj.name + "</td><td align='right'>$" + OrderChargesItemSubItemSubItemObj.price + "</td>";
                                    } else {
                                        builtOutHTMLText += "<tr><td align='left' style='padding-left:6%'>" + OrderChargesItemSubItemSubItemObj.name + "</td><td align='right'>$" + '' + "</td>";
                                    }
                                }
                            }

                        }
                    }

                }
                var futureBills = OrderDetail.futureBills;
                var futureBillslength = futureBills.length;
                for (var i = 0; i < futureBillslength; i++) {
                    var OrderChargesObj = futureBills[i];
                    builtOutHTMLText += "<tr><th align='left' style='border-bottom: 2px solid black;'>" + OrderChargesObj.title + "</th><th align='right' style='border-bottom: 2px solid black;'>" + (OrderChargesObj.subtotal) + "</th>";
                    var itemLenght = OrderChargesObj.items.length;
                    var OrderChargesItem = OrderChargesObj.items;
                    for (var j = 0; j < itemLenght; j++) {
                        var OrderChargesItemObj = OrderChargesItem[j];
                        var OrderChargesItemSubItem = OrderChargesItemObj.subItems;
                        var OrderChargesItemObjSubItemsLength = OrderChargesItemSubItem.length;
                        for (var k = 0; k < OrderChargesItemObjSubItemsLength; k++) {
                            var OrderChargesItemSubItemObj = OrderChargesItemSubItem[k];
                            builtOutHTMLText += "<tr><td align='left' style='padding-left:4%' colspan='2'>" + OrderChargesItemSubItemObj.name + "</td>";
                            var OrderChargesItemSubItemSubItem = OrderChargesItemSubItemObj.subItems;
                            if (OrderChargesItemSubItemSubItem != null) {
                                var subItemlength = OrderChargesItemSubItemSubItem.length;
                                for (var l = 0; l < subItemlength; l++) {
                                    var OrderChargesItemSubItemSubItemObj = OrderChargesItemSubItemSubItem[l];
                                    builtOutHTMLText += "<tr><td align='left' style='padding-left:6%' colspan='2'>" + OrderChargesItemSubItemSubItemObj.name + "</td>";
                                }
                            }

                        }
                    }
                    builtOutHTMLText += ("</tr>");
                }

                builtOutHTMLText += ("</table>");
                console.log(builtOutHTMLText);
                this.template.querySelector('[data-id="manualRichText"]').innerHTML = builtOutHTMLText;
                //this.myVal = builtOutHTMLText;
                this.didPreview = true;
                this.Loading = false;
                    //sendRccApex({ accountId:this.resp.Billing_Account__c, personEmail:emailVal, Accountnumber:this.resp.Billing_Account__r.AccountNumber, richTextBody: builtOutHTMLText, doCallFlow: false})
                    //console.log(builtOutHTMLText);
                
            })
        
    }
    get showSubmitButton(){
        return this.isCRISacc || this.didPreview;
    }
    accountValueChange(evt){
        console.log(evt);
        console.log(evt.target);
        if(this.initialAccNumBlank){
            if(evt && evt.target&& evt.target.value && evt.target.value.length >=10){
                this.isCRISacc = true;
            }else{
                this.isCRISacc = false;
            }
        }
    }
    handleKeyDown(evt){
        var theEvent = evt || window.event;
        var key = theEvent.keyCode || theEvent.which;
        key = String.fromCharCode(key);
        var regex = /[]|\./;
        if(!regex.test(key)) {
            theEvent.returnValue = false;
            if(theEvent.preventDefault) theEvent.preventDefault();
        }
    }
    sendRCC(){
        var richText;
        
        if(this.isCRISacc){
            richText = this.template.querySelector('[data-id="RichTextInput"]')
        }else{
            richText =this.template.querySelector('[data-id="manualRichText"]')
        }
        let orderVal = this.template.querySelector('[data-id="orderField"]');

        if(!orderVal || !orderVal.value){
            const evt = new ShowToastEvent({
                title: 'RCC Error',
                message: 'Order number required to send email for quote.',
                variant: 'error',
            });
            this.dispatchEvent(evt);
            return;
        }
        if(orderVal.value && orderVal.value.startsWith("D")){
            const evt = new ShowToastEvent({
                title: 'RCC Error',
                message: 'RCC Quotes aren\'t allowed for Disconnect orders.',
                variant: 'error',
            });
            this.dispatchEvent(evt);
            return;
        }
        if(this.isCRISacc){
            const acknowledgement = this.template.querySelector('[data-id="CRISacknowledgeStatement"]');
            console.log(acknowledgement);
            if(!acknowledgement || !acknowledgement.checked){
                const evt = new ShowToastEvent({
                    title: 'RCC Error',
                    message: 'CRIS acknowledgement message required.',
                    variant: 'error',
                });
                this.dispatchEvent(evt);
                return;
            }
        }
        if(!richText || (!richText.value && !richText.innerHTML)){
            const evt = new ShowToastEvent({
                title: 'RCC Error',
                message: 'The RCC email must include an attached quote.',
                variant: 'error',
            });
            this.dispatchEvent(evt);
            console.log('have to include quote');
        }
        
        richText = richText.value ? richText.value : richText.innerHTML;
        console.log(richText);
        generateShortenedURL({ accountId:this.resp.Id, 
                        orderNumber: orderVal.value, 
                        richTextBody: richText, 
                        RecordId: this.recordId 
                        })
				.then(resp=>{	
                    console.log(resp);
                    if(resp && resp.shortenedURL){	
                        ConsoleApiBridge.callMethod({	
                            name: "sendMessage",	
                            apiType: "conversationKit",	
                            parametersObject: {	
                              recordId: this.recordId,	
                                message:{
                                  text:"HIDEMESSAGE?Link to quote sent: "+resp.shortenedURL
                              }	
                            }	
                          });	
                            ConsoleApiBridge.callMethod({	
                              name: "sendMessage",	
                              apiType: "conversationKit",	
                              parametersObject: {	
                                recordId: this.recordId,	
                                  message:{
                                    text:"GENERATEQUOTE?"+resp.commId
                                }	
                              }	
                            });	
                            
                         
                    }
                    if(resp && resp.commId){
                        ConsoleApiBridge.callMethod({	
                            name: "getEnclosingTabId",	
                            apiType: "workspace"	
                          }).then(tabId => {	
                            ConsoleApiBridge.callMethod({	
                              name: "openSubtab",	
                              apiType: "workspace",	
                              parametersObject: {	
                                parentTabId: tabId,	
                                  recordId: resp.commId,	
                                  focus:false	
                              }	
                            });	
                          });	
                    }
                    const evt = new ShowToastEvent({
                        title: 'RCC Sent',
                        message: 'Quote was sent to customer',
                        variant: 'success',
                    });
                    this.dispatchEvent(evt);
                    
                    
                    this.closeModal();	
                    	
                });
                
                
        
        
    }

}