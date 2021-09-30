import { LightningElement,api } from 'lwc';
import sendRccApex from "@salesforce/apex/SendRCCPartnerController.sendRccToMC";
import queryDatabase from "@salesforce/apex/LwcUtils.queryDatabase";
export default class AgentPartnerSendRCC extends LightningElement {
    @api richText;
    @api orderNumber;
    errorMessage;
    successMessage;
    beforeSend = true;
    rendered = false;
    hasRendered = false;
    renderedCallback(){
        console.log(this.richText);
        if(this.hasRendered) return;
        this.hasRendered = true;
        this.template.querySelector('[data-id="manualRichText"]').innerHTML = this.richText;
    }
    
    
  
    
    sendRCC(){
        this.errorMessage = '';
        this.successMessage = '';
        var validSend = false;
        var richText;
        
        richText =this.template.querySelector('[data-id="manualRichText"]');
        console.log(richText);
        //var richText = this.template.querySelector('[data-id="RichTextInput"]');
        let emailVal = this.template.querySelector('[data-id="emailField"]');
        let orderVal = this.template.querySelector('[data-id="orderField"]');
        if(!orderVal || !orderVal.value){
            
            this.errorMessage = 'Order number required to send email for quote.';
            return;
        }
        
        if(emailVal && emailVal.value){
            emailVal = emailVal.value;
            
            if(richText){
                richText = richText.innerHTML;
                validSend = true;
                
            }else{

                this.errorMessage = 'The RCC email must include an attached quote.';
            }
            if(validSend){
                console.log( orderVal.value);
                sendRccApex({  personEmail:emailVal, orderNumber: orderVal.value,  richTextBody: richText})
                .then( (resp)=>{
                    if(resp){
                        console.log(resp);
                        loopPromise({
                            shouldExit: result => {
                              console.log(result);
                              if(!result) return false;
                              if(result && result.length == 1){
                                var resultVar = result[0];
                                if(resultVar){
                                    return resultVar.Has_Accepted_RCC__c;
                                }else{
                                    return false;
                                }
                                
                              }else{
                                  return false;
                                }
                            },
                            getPromise: () => {
                              return queryDatabase({
                                query:
                                  "Select Id, Has_Accepted_RCC__c from Communications__c where Id = '" +
                                  resp +
                                  "'"
                              });
                            },
                            onLoopDone: () => {
                                this.successMessage = 'User accepted RCCs';
                            },
                            delay: 5000
                          });
                    }
                    this.beforeSend = false;
                    this.successMessage = 'Email was successfully sent to '+emailVal;
                    setTimeout(() => {
                        this.successMessage ='';
                    }, 3000);
                });
                
                
            }
        }else{
            this.errorMessage = 'Email is required.';
           
        }

        function loopPromise({ shouldExit, getPromise, onLoopDone, delay = 0 }) {
            // eslint-disable-next-line consistent-return
            getPromise().then(result => {
              // eslint-disable-next-line @lwc/lwc/no-async-operation
              if (!shouldExit(result))
                return setTimeout(() => {
                  loopPromise({
                    shouldExit: shouldExit,
                    getPromise: getPromise,
                    onLoopDone: onLoopDone,
                    delay: delay
                  });
                }, delay);
              onLoopDone();
            });
            //catch needed
            //on fail
          }
      
        
    }

    
}