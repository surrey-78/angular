import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { XMLParser } from 'fast-xml-parser';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SapService {
  private loginUrl = '/sap/bc/srt/scs/sap/zsd_login_007?sap-client=100';
  private dashUrl = '/sap/bc/srt/scs/sap/zsd_dashboard_007?sap-client=100';
  private finUrl = '/sap/bc/srt/scs/sap/zsd_finance_007?sap-client=100';
  private getPdfUrl = '/sap/bc/srt/scs/sap/zsd_get_data_007?sap-client=100';

  private parser = new XMLParser({
    ignoreAttributes: true,
    removeNSPrefix: true,
    parseTagValue: true,
    trimValues: true,
    // This function handles empty tags safely for TypeScript
    tagValueProcessor: (tagName, tagValue, jPath, hasAttributes, isLeafNode) => {
      if (isLeafNode && tagValue === "") {
        return null;
      }
      return tagValue;
    }
  });

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const sapCredentials = 'k902007:Surrey@7824'; 
    return new HttpHeaders({
      'Content-Type': 'text/xml; charset=utf-8',
      'Authorization': 'Basic ' + btoa(sapCredentials),
      'SOAPAction': '""' 
    });
  }

  // --- THE MISSING METHOD ---
  login(kunnr: string, pass: string): Observable<any> {
    const body = this.createEnvelope('ZfmLoginProfile007', 
      `<IvKunnr>${kunnr}</IvKunnr><IvPassword>${pass}</IvPassword>`);
    
    return this.http.post(this.loginUrl, body, { headers: this.getHeaders(), responseType: 'text' })
      .pipe(map(res => this.extractData(res, 'ZfmLoginProfile007Response')));
  }

  getDashboard(kunnr: string): Observable<any> {
    const formattedKunnr = kunnr.padStart(10, '0');
    const body = this.createEnvelope('ZfmDashboard007', `<IvKunnr>${formattedKunnr}</IvKunnr>`);
    return this.http.post(this.dashUrl, body, { headers: this.getHeaders(), responseType: 'text' })
      .pipe(map(res => this.extractData(res, 'ZfmDashboard007Response')));
  }

  getFinanceSheet(kunnr: string): Observable<any> {
    const formattedKunnr = kunnr.padStart(10, '0');
    const body = this.createEnvelope('ZfmFinanceSheet007', `<IvKunnr>${formattedKunnr}</IvKunnr>`);
    return this.http.post(this.finUrl, body, { headers: this.getHeaders(), responseType: 'text' })
      .pipe(map(res => this.extractData(res, 'ZfmFinanceSheet007Response')));
  }

  private createEnvelope(funcName: string, innerXml: string): string {
    return `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:sap-com:document:sap:soap:functions:mc-style">
       <soapenv:Body>
          <urn:${funcName}>${innerXml}</urn:${funcName}>
       </soapenv:Body>
    </soapenv:Envelope>`;
  }

  private extractData(xml: string, responseTag: string) {
    try {
      const jsonObj = this.parser.parse(xml);
      const soapBody = jsonObj.Envelope?.Body || jsonObj.Body;
      if (!soapBody) return null;

      const findNested = (obj: any, target: string): any => {
        if (obj[target]) return obj[target];
        for (const key in obj) {
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            const found = findNested(obj[key], target);
            if (found) return found;
          }
        }
        return null;
      };
      return findNested(soapBody, responseTag);
    } catch (e) {
      return null;
    }
  }

  getInvoicePdf(vbeln: string): Observable<any> {
  const formattedVbeln = vbeln.padStart(10, '0');
  // Tag must match your FM input 'INV_NO' -> 'InvNo'
  const body = this.createEnvelope('ZfmGetData007', `<InvNo>${formattedVbeln}</InvNo>`);
  
  return this.http.post(this.getPdfUrl, body, { 
    headers: this.getHeaders(), 
    responseType: 'text' 
  }).pipe(
    map(res => this.extractData(res, 'ZfmGetData007Response'))
  );
}
}