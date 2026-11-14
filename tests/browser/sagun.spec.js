import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { mockApi, MEMBER, ADMIN, NOT_LOGGED_IN } from './mock-api';
const schema=JSON.parse(fs.readFileSync(new URL('./sagun-schema.json',import.meta.url),'utf8'));
const empty=()=>({profiles:[],incoming:[],outgoing:[],notices:[]});
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9kAAAAASUVORK5CYII=','base64');
for(const lang of ['en','hi']){
 test(`${lang}: private draft, photo upload, dynamic Sagun, preview and submit validation`,async({page})=>{
  const hi=lang==='hi';await page.setViewportSize({width:hi?390:320,height:900});await page.addInitScript(value=>localStorage.setItem('pss_lang',value),lang);
  await mockApi(page,{'GET /auth/me':MEMBER,'GET /sagun/schema':schema});const own=empty();let saved;let submissions=0;
  await page.route('**/api/v1/sagun/me',route=>route.fulfill({json:own}));
  await page.route('**/api/v1/sagun/profiles?**',route=>route.fulfill({json:{records:[],hasMore:false}}));
  const save=async route=>{saved=route.request().postDataJSON();if(saved.action==='SUBMIT'){submissions++;return route.fulfill({status:400,json:{error:'SAGUN_FIELD:dob'}});}const result={id:'profile-1',reference:'SAGUN-TEST',data:saved.data,status:'DRAFT',visibility:saved.data.visibility||'PRIVATE',files:[]};own.profiles=[result];return route.fulfill({json:result});};
  await page.route('**/api/v1/sagun/profiles',save);await page.route('**/api/v1/sagun/profiles/profile-1',save);
  await page.route('**/api/v1/sagun/profiles/profile-1/files/PHOTO',async route=>{expect(route.request().headers()['content-type']).toContain('multipart/form-data');own.profiles[0].files=[{id:'photo-1',kind:'PHOTO',mime:'image/png',size:png.length}];return route.fulfill({json:own.profiles[0].files[0]});});
  await page.route('**/api/v1/sagun/files/photo-1',route=>route.fulfill({contentType:'image/png',body:png}));
  await page.goto('/sagun');await expect(page.locator('#sagun-fullName')).toBeVisible();
  await page.locator('#sagun-candidateType').selectOption('GROOM');await page.locator('#sagun-fullName').fill('TEST CANDIDATE');
  await page.getByRole('button',{name:hi?'ड्राफ़्ट सहेजें':'Save Draft',exact:true}).click();await expect(page.getByRole('status').filter({hasText:hi?'बैकएंड':'backend'})).toContainText(hi?'बैकएंड':'backend');expect(saved.action).toBe('DRAFT');expect(saved.data.visibility).toBe('PRIVATE');
  await expect(page.locator('#sagun-photoFileId')).toBeDisabled();await page.locator('#sagun-upload-consent').check();await page.locator('#sagun-photoFileId').setInputFiles({name:'test.png',mimeType:'image/png',buffer:png});
  await expect(page.getByRole('button',{name:hi?'निजी रूप से डाउनलोड करें':'Download privately',exact:true})).toBeVisible();
  await page.getByRole('button',{name:/^6\./}).click();await page.getByRole('button',{name:hi?'वस्तु जोड़ें':'Add Item',exact:true}).click();
  await page.locator('#item-0-name').fill('Voluntary coconut');await page.locator('#item-0-quantity').fill('1');await page.locator('#item-0-donorName').fill('Test Donor');await page.locator('#item-0-recipient').selectOption('BRIDE');await page.locator('#item-0-recordStatus').selectOption('GIVEN');await page.locator('#sagun-voluntaryConsent').check();
  await page.getByRole('button',{name:hi?'ड्राफ़्ट सहेजें':'Save Draft',exact:true}).click();await expect.poll(()=>saved.data.sagunItems?.[0]?.name).toBe('Voluntary coconut');expect(saved.data.voluntaryConsent).toBe(true);
  await page.getByRole('group').getByRole('button',{name:hi?'परिचय का पूर्वावलोकन':'Preview Profile',exact:true}).click();await expect(page.getByText('TEST CANDIDATE',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:hi?'स्वीकृति के लिए जमा करें':'Submit for Approval',exact:true}).click();await expect.poll(()=>submissions).toBe(1);await expect(page.getByRole('alert')).toContainText(hi?'जन्म तिथि':'Date of Birth');await expect(page.locator('#sagun-dob')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
 test(`${lang}: member search redaction and a secure contact request`,async({page})=>{
  const hi=lang==='hi';await page.addInitScript(value=>localStorage.setItem('pss_lang',value),lang);await mockApi(page,{'GET /auth/me':MEMBER,'GET /sagun/schema':schema,'GET /sagun/me':empty()});
  let search;let inquiry;
  await page.route('**/api/v1/sagun/profiles?**',route=>{search=new URL(route.request().url()).searchParams;return route.fulfill({json:{records:[{id:'visible-profile',name:'Registered Member',age:28,city:'Indore',candidateType:'BRIDE',education:'Graduate',occupation:'Teacher'}],hasMore:false}});});
  await page.route('**/api/v1/sagun/profiles/visible-profile',route=>route.fulfill({json:{id:'visible-profile',name:'Registered Member',data:{fullName:'Registered Member',education:'Graduate',city:'Indore'},contact:null,sagun:null}}));
  await page.route('**/api/v1/sagun/profiles/visible-profile/inquiries',async route=>{inquiry=route.request().postDataJSON();return route.fulfill({json:{id:'inquiry-1',status:'PENDING'}});});
  await page.goto('/sagun');await page.getByRole('button',{name:hi?'परिचय खोजें':'Browse Profiles',exact:true}).click();await page.locator('#search-city').fill('Indore');await page.getByRole('button',{name:hi?'खोजें':'Search',exact:true}).click();await expect.poll(()=>search?.get('city')).toBe('Indore');
  await page.getByRole('button',{name:hi?'परिचय देखें':'View Profile',exact:true}).click();await expect(page.locator('#sagun-inquiry-message')).toBeVisible();
  await expect(page.getByText('9000000000',{exact:true})).toHaveCount(0);await page.locator('#sagun-inquiry-message').fill('Test introduction');await page.locator('#sagun-inquiry-consent').check();
  await page.getByRole('button',{name:hi?'संपर्क अनुरोध भेजें':'Send Contact Request',exact:true}).click();await expect.poll(()=>inquiry?.consent).toBe(true);
 });
 test(`${lang}: owner can grant and revoke private Sagun access`,async({page})=>{
  const hi=lang==='hi';await page.addInitScript(value=>localStorage.setItem('pss_lang',value),lang);const mine=empty();mine.incoming=[{id:'inquiry-1',profileId:'profile-1',profileName:'Owner Candidate',senderName:'Requesting Member',message:'Introduction',status:'PENDING',shareSagun:false,contact:null}];
  await mockApi(page,{'GET /auth/me':MEMBER,'GET /sagun/schema':schema,'GET /sagun/profiles':{records:[],hasMore:false}});
  await page.route('**/api/v1/sagun/me',route=>route.fulfill({json:mine}));let action;
  await page.route('**/api/v1/sagun/inquiries/inquiry-1',async route=>{action=route.request().postDataJSON();Object.assign(mine.incoming[0],{status:action.action==='REVOKE'?'DECLINED':'ACCEPTED',shareSagun:Boolean(action.shareSagun)});return route.fulfill({json:{ok:true}});});
  await page.goto('/sagun');await page.getByRole('button',{name:hi?'संपर्क अनुरोध':'Contact Requests',exact:true}).click();await page.locator('#grant-inquiry-1').check();
  await page.getByRole('button',{name:hi?'स्वीकार करें':'Accept',exact:true}).click();await expect.poll(()=>action?.shareSagun).toBe(true);
  await page.getByRole('button',{name:hi?'अनुमति वापस लें':'Revoke Access',exact:true}).click();await expect.poll(()=>action?.action).toBe('REVOKE');
 });
}
test('public visitors cannot browse private matrimonial profiles',async({page})=>{await mockApi(page,{'GET /auth/me':NOT_LOGGED_IN,'GET /sagun/schema':schema});await page.goto('/sagun');await expect(page.getByRole('link',{name:'Member Login',exact:true}).filter({visible:true}).last()).toHaveAttribute('href','/login?returnTo=%2Fsagun');await expect(page.locator('#search-name')).toHaveCount(0);});
test('admin approval and protected field configuration use real API actions',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('pss_lang','en'));const state={profiles:[{id:'profile-1',reference:'SAGUN-TEST',displayName:'Test Candidate',userId:MEMBER.id,data:{fullName:'Test Candidate'},files:[],status:'PENDING',visibility:'PRIVATE'}],audits:[]};
 await mockApi(page,{'GET /auth/me':ADMIN,'GET /sagun/schema':schema});await page.route('**/api/v1/sagun/admin',route=>route.fulfill({json:state}));let review;let settings;
 await page.route('**/api/v1/sagun/admin/profiles/profile-1/review',async route=>{review=route.request().postDataJSON();state.profiles[0].status=review.status;return route.fulfill({json:{ok:true}});});
 await page.route('**/api/v1/sagun/admin/schema',async route=>{settings=route.request().postDataJSON();return route.fulfill({json:schema});});
 await page.goto('/admin/sagun');await page.locator('#review-profile-1').fill('Test verified');await page.getByRole('button',{name:'Approve',exact:true}).click();await expect.poll(()=>review?.status).toBe('APPROVED');
 await page.getByRole('button',{name:'Configure Fields',exact:true}).click();await expect(page.locator('#config-dob-required')).toBeDisabled();await expect(page.locator('#config-cashSagun-required')).toBeDisabled();
 await page.locator('#config-college-required').check();await page.getByRole('button',{name:'Save Field Configuration',exact:true}).click();await expect.poll(()=>settings?.overrides?.college?.required).toBe(true);
});

test('admin can switch into administration on the common Sagun page',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('pss_lang','en'));
 await mockApi(page,{'GET /auth/me':ADMIN,'GET /sagun/schema':schema,'GET /sagun/me':empty(),'GET /sagun/profiles':{records:[],hasMore:false},'GET /sagun/admin':{profiles:[],audits:[]}});
 await page.goto('/sagun');await page.getByRole('button',{name:'Manage Sagun here',exact:true}).click();await expect(page.getByRole('button',{name:'Configure Fields',exact:true})).toBeVisible();await expect(page).toHaveURL(/\/sagun$/);await page.getByRole('button',{name:'Member workspace',exact:true}).click();await expect(page.getByRole('button',{name:'My Profiles',exact:true})).toBeVisible();
});
for(const lang of ['en','hi'])test(`${lang}: consent withdrawal is confirmed by backend and gift worksheet stays private`,async({page})=>{
 const hi=lang==='hi';await page.addInitScript(value=>localStorage.setItem('pss_lang',value),lang);
 const own=empty();own.profiles=[{id:'own',userId:MEMBER.id,reference:'SAGUN-PRIVATE',displayName:'Test',status:'APPROVED',visibility:'MEMBERS',data:{fullName:'Test',sagunItems:[{name:'Coconut',recipient:'BRIDE',recordStatus:'GIVEN',donorName:'Private Donor',donorRelationship:'Uncle',value:100}]},files:[]}];
 await mockApi(page,{'GET /auth/me':MEMBER,'GET /sagun/schema':schema,'GET /sagun/profiles':{records:[],hasMore:false}});
 await page.route('**/api/v1/sagun/me',route=>route.fulfill({json:own}));await page.route('**/api/v1/sagun/profiles/own',route=>route.fulfill({json:own.profiles[0]}));
 let withdrawn=false;await page.route('**/api/v1/sagun/profiles/own/consent-withdrawal',route=>{withdrawn=true;own.profiles[0].status='DEACTIVATED';own.profiles[0].visibility='PRIVATE';return route.fulfill({json:{ok:true}});});
 await page.goto('/sagun');await page.getByRole('button',{name:hi?'मेरे परिचय':'My Profiles',exact:true}).click();await page.getByRole('article').getByRole('button',{name:hi?'परिचय का पूर्वावलोकन':'Preview Profile',exact:true}).click();await expect(page.locator('#sagun-gift-print')).toContainText('Private Donor');
 page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:hi?'सहमति वापस लें':'Withdraw Consent',exact:true}).click();await expect.poll(()=>withdrawn).toBe(true);await expect(page.locator('#sagun-gift-print')).toHaveCount(0);
});
