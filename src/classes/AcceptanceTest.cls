/**
 * @author IBM
 * @date May 8, 2020
 * @description Test utility that can be used to format robust assertion messages
 * This promotes the "living documentation" function of unit testing. 
 * 
 * Assertion messages follow the Given/When/Then syntax as specified in "Specification 
 * By Example" or "Behavior Driven Development". For more context, see Martin Fowler's
 * explanation of the Given/When/Then form of representing test messages here:
 * https://martinfowler.com/bliki/GivenWhenThen.html
 */
@isTest
public inherited sharing class AcceptanceTest {
    private String givenMessage;
    private String whenMessage;
    private String thenMessage;
    
    /**
    * @description Specify a message to appear in a "GIVEN" clause
    */
    public void given(String message) {
        this.givenMessage = message;
    }
    
    /**
    * @description Specify a message to appear in a "WHEN" clause
    */
    public void when(String message) {
        this.whenMessage = message;
    }
    
    /**
    * @description Specify a message to appear in a "THEN" clause. 
    * If this method is called multiple times, it will replace the 
    * previous value provided. This allows for an apex test creator
    * to use the same "given" and "when" values, and change the "then"
    * clause for different test assertions.
    */
    public void then(String message) {
        this.thenMessage = message;
    }
    
    /**
    * @description Returns a message in the Given/When/Then format
    * @returns a String that concatenates the previously provided 
    * given, when, and then messages with the words "GIVEN", "WHEN",
    * and "THEN", and new lines separating each clause.
    */
    public String message() {
       	String output = '\n';
        if(String.isNotEmpty(this.givenMessage)) {
            output += 'GIVEN ' + this.givenMessage + '\n';
        }
        if(String.isNotEmpty(this.whenMessage)) {
            output += 'WHEN ' + this.whenMessage + '\n';
        }
        if(String.isNotEmpty(this.thenMessage)) {
            output += 'THEN ' + this.thenMessage + '\n';
        }
        return output;
    }
}