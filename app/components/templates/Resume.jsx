/* eslint one-var: 0 */
import React from 'react';
import BaseTemplate from './Base';

import './resume/style.scss';

/**
 * Invoice template
 */
export default class Resume extends BaseTemplate {

  getDefaultData() {
    return {
      reference: '[reference]',
      date: '[date]',
      amount: '[amount]',
      companyAddress: {
        name: '[companyAddress/name]',
        street: '[companyAddress/street]',
        zipCode: '[companyAddress/zipcode]',
        city: '[companyAddress/city]',
        country: '[companyAddress/country]',
        businessID: '[companyAddress/businessID]'
      },
      customerAddress: {
        name: '[customerAddress/name]',
        street: '[customerAddress/street]',
        zipCode: '[customerAddress/zipcode]',
        city: '[customerAddress/city]',
        country: '[customerAddress/country]',
        businessID: '[customerAddress/businessID]'
      }
    };
  }

  render() {
    const data = this.getData();

    return (
      <div>
        <div className="logo"></div>
        <div className="header1"></div>
        <div className="presentation">
          <span className="name">Rory Williams</span>
          <span className="role">assistant du docteur</span>
          <span className="experience">2 ans d'expérience</span>
        </div>
        <div className="header2"></div>
        <div className="description">
          <ul>
            <li>Consultant</li>
            <li>Développeur Java</li>
            <li>Agile</li>
          </ul>
          <ul>
            <li>
              Formateur
              <ul>
                <li>Angular JS</li>
                <li>Angular 2</li>
                <li>Ecplise RCP</li>
              </ul>
            </li>
          </ul>
          <ul>
            <li>
              Conférencier
              <ul>
                <li>Devoxx</li>
                <li>Mix IT</li>
              </ul>
            </li>
          </ul>
        </div>
        <div className="header3"></div>
        <div className="expertise">
          <span className="title">Expertise</span>
          <ul>
            <li><span className="expertise-icon">✈</span></li>
            <li>JAVA / JEE</li>
            <li>EJB 3.2, Servlet, JSP, JAXB, JPA, JMS, JDBC</li>
            <li><span className="expertise-icon">✈</span></li>
            <li>Spring (Core, Batch, Boot), CDI, XML, XSL, XSD, JUnit, Jenkins, Jrules, Hibernate, Struts, Velocity</li>
            <li><span className="expertise-icon">✈</span></li>
            <li>Weblogic 9/11/12, Tomcat 7, Glassfish</li>
            <li><span className="expertise-icon">✈</span></li>
            <li>Oracle 10g, MySQL</li>
            <li><span className="expertise-icon">✈</span></li>
            <li>Subversion, GIT, Intellij, STS</li>
            <li><span className="expertise-icon">✈</span></li>
            <li>Scrum</li>
          </ul>
        </div>

        <div className="mission-title">
          <span className="title">Dernière mission</span>
        </div>

        {this.props.content}
      </div>
    );
  }
}
