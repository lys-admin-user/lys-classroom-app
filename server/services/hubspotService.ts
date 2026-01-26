import { Client } from '@hubspot/api-client';
import { FilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/contacts';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings?.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  if (!hostname) {
    throw new Error('HubSpot integration not available: REPLIT_CONNECTORS_HOSTNAME not configured. Please set up the HubSpot connector in your Replit project.');
  }
  
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('HubSpot integration not available: Replit identity token not found. This may indicate a configuration issue.');
  }

  try {
    const response = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=hubspot',
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch HubSpot connector settings: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    connectionSettings = data.items?.[0];
  } catch (error: any) {
    throw new Error(`Failed to connect to HubSpot connector service: ${error.message}`);
  }

  if (!connectionSettings || !connectionSettings.settings) {
    throw new Error('HubSpot not connected: No connection settings found. Please connect HubSpot in your Replit project settings.');
  }

  const accessToken = connectionSettings.settings.access_token || connectionSettings.settings.oauth?.credentials?.access_token;

  if (!accessToken) {
    throw new Error('HubSpot not connected: No access token available. Please reconnect HubSpot in your project settings.');
  }
  
  return accessToken;
}

export async function getUncachableHubSpotClient() {
  const accessToken = await getAccessToken();
  return new Client({ accessToken });
}

export interface HubSpotContact {
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  organization?: string;
  country?: string;
  tier?: string;
}

export interface HubSpotCompany {
  name: string;
  domain?: string;
  type?: string;
  country?: string;
  industry?: string;
}

export async function createOrUpdateContact(contact: HubSpotContact): Promise<any> {
  try {
    const client = await getUncachableHubSpotClient();
    
    const properties: Record<string, string> = {
      email: contact.email,
    };
    
    if (contact.firstName) properties.firstname = contact.firstName;
    if (contact.lastName) properties.lastname = contact.lastName;
    if (contact.role) properties.jobtitle = contact.role;
    if (contact.organization) properties.company = contact.organization;
    if (contact.country) properties.country = contact.country;
    if (contact.tier) properties.lys_subscription_tier = contact.tier;
    
    const searchResponse = await client.crm.contacts.searchApi.doSearch({
      filterGroups: [{
        filters: [{
          propertyName: 'email',
          operator: FilterOperatorEnum.Eq,
          value: contact.email
        }]
      }],
      properties: ['email', 'firstname', 'lastname'],
      limit: 1,
    });
    
    if (searchResponse.results.length > 0) {
      const existingContact = searchResponse.results[0];
      return await client.crm.contacts.basicApi.update(existingContact.id, { properties });
    } else {
      return await client.crm.contacts.basicApi.create({ properties });
    }
  } catch (error) {
    console.error('HubSpot createOrUpdateContact error:', error);
    throw error;
  }
}

export async function createOrUpdateCompany(company: HubSpotCompany): Promise<any> {
  try {
    const client = await getUncachableHubSpotClient();
    
    const properties: Record<string, string> = {
      name: company.name,
    };
    
    if (company.domain) properties.domain = company.domain;
    if (company.type) properties.type = company.type;
    if (company.country) properties.country = company.country;
    if (company.industry) properties.industry = company.industry;
    
    if (company.domain) {
      const searchResponse = await client.crm.companies.searchApi.doSearch({
        filterGroups: [{
          filters: [{
            propertyName: 'domain',
            operator: FilterOperatorEnum.Eq,
            value: company.domain
          }]
        }],
        properties: ['name', 'domain'],
        limit: 1,
      });
      
      if (searchResponse.results.length > 0) {
        const existingCompany = searchResponse.results[0];
        return await client.crm.companies.basicApi.update(existingCompany.id, { properties });
      }
    }
    
    return await client.crm.companies.basicApi.create({ properties });
  } catch (error) {
    console.error('HubSpot createOrUpdateCompany error:', error);
    throw error;
  }
}

export async function createDeal(dealData: {
  name: string;
  amount?: number;
  stage?: string;
  contactId?: string;
  companyId?: string;
}): Promise<any> {
  try {
    const client = await getUncachableHubSpotClient();
    
    const properties: Record<string, string> = {
      dealname: dealData.name,
    };
    
    if (dealData.amount) properties.amount = dealData.amount.toString();
    if (dealData.stage) properties.dealstage = dealData.stage;
    
    const associations: any[] = [];
    
    if (dealData.contactId) {
      associations.push({
        to: { id: dealData.contactId },
        types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }]
      });
    }
    
    if (dealData.companyId) {
      associations.push({
        to: { id: dealData.companyId },
        types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 5 }]
      });
    }
    
    const deal = await client.crm.deals.basicApi.create({ 
      properties,
      associations: associations.length > 0 ? associations : undefined
    });
    
    return deal;
  } catch (error) {
    console.error('HubSpot createDeal error:', error);
    throw error;
  }
}

export async function getContacts(limit: number = 10): Promise<any[]> {
  try {
    const client = await getUncachableHubSpotClient();
    const response = await client.crm.contacts.basicApi.getPage(limit);
    return response.results;
  } catch (error) {
    console.error('HubSpot getContacts error:', error);
    throw error;
  }
}

export async function getCompanies(limit: number = 10): Promise<any[]> {
  try {
    const client = await getUncachableHubSpotClient();
    const response = await client.crm.companies.basicApi.getPage(limit);
    return response.results;
  } catch (error) {
    console.error('HubSpot getCompanies error:', error);
    throw error;
  }
}

export async function syncUserToHubSpot(user: {
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  tier?: string;
  country?: string;
}): Promise<any> {
  return createOrUpdateContact({
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    tier: user.tier,
    country: user.country,
  });
}

export async function syncOrganizationToHubSpot(org: {
  name: string;
  type?: string;
  country?: string;
}): Promise<any> {
  return createOrUpdateCompany({
    name: org.name,
    type: org.type,
    country: org.country,
    industry: 'Education',
  });
}
