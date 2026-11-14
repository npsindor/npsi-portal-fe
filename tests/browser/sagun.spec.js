import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { mockApi, MEMBER, ADMIN, NOT_LOGGED_IN } from './mock-api';
const schema=JSON.parse(fs.readFileSync(new URL('./sagun-schema.json',import.meta.url),'utf8'));
const empty=()=>({profiles:[],incoming:[],outgoing:[],notices:[]});
const FAMILY={family:{familyId:'NPSI-FAM-000001',familyName:'Patidar',village:'Sanawad'},registrationEnabled:true,members:[
 {id:'member-son',membershipId:'NPSI-MEM-000010',name:'Rahul Patidar',relationship:'Son',gender:'MALE',age:25,minimumAge:21,eligible:true,reason:null,application:null},
 {id:'member-minor',membershipId:'NPSI-MEM-000011',name:'Radha Patidar',relationship:'Daughter',gender:'FEMALE',age:16,minimumAge:18,eligible:false,reason:'UNDERAGE',application:null}]};
const PREFILL={member:{id:'member-son',membershipId:'NPSI-MEM-000010',familyId:'NPSI-FAM-000001',name:'Rahul Patidar',gender:'MALE',age:25,dob:'2001-01-01',village:'Sanawad'},
 eligibility:{eligible:true,reason:null},existing:null,student:{studentId:'NPSI-STU-000001',course:'B.Tech',institution:'NPSI University',academicYear:'2025-2026'},sourceConflicts:['dob'],lockedKeys:['dob','candidateType'],prefill:{fullName:'Rahul Patidar',candidateType:'GROOM',dob:'2001-01-01',fatherName:'Ramesh Patidar',education:'B.Tech',college:'NPSI University',professionalDetails:'2025-2026',district:'Indore',city:'Indore'}};
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9kAAAAASUVORK5CYII=','base64');
test('Sagun navigation opens a two-radio selector and routes directly to the chosen registration category',async({page})=>{
 await page.setViewportSize({width:1280,height:844});await page.addInitScript(()=>localStorage.setItem('pss_lang','en'));await mockApi(page,{'GET /auth/me':NOT_LOGGED_IN,'GET /sagun/schema':schema});await page.route('**/api/v1/sagun/profiles',route=>route.fulfill({status:403,json:{error:'SAGUN_MEMBER_REQUIRED'}}));
 await page.goto('/');await page.getByRole('link',{name:'Sagun',exact:true}).first().click();await expect(page).toHaveURL(/\/sagun$/);await page.setViewportSize({width:390,height:844});
 await expect(page.getByRole('radio')).toHaveCount(2);await expect(page.getByRole('checkbox')).toHaveCount(0);
 await expect(page.getByRole('navigation').locator('details').filter({hasText:'Sagun'})).toHaveCount(0);await page.getByRole('radio',{name:/Bride Registration/}).click();await expect(page).toHaveURL(/\/sagun\?category=bride$/);
 await expect(page.getByRole('radio')).toHaveCount(0);await expect(page.locator('#sagun-fullName')).toBeVisible();await expect(page.getByText('Requirements, privacy and official guidance')).toHaveCount(0);await page.getByRole('button',{name:'Submit for Approval',exact:true}).click();await expect(page.getByText('Family registration on the NPS Indore portal is mandatory to submit a Sagun application. Please register your family first.')).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
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
  await page.route('**/api/v1/sagun/eligible-members',route=>route.fulfill({json:FAMILY}));
  await page.route('**/api/v1/sagun/eligible-members/member-son',route=>route.fulfill({json:PREFILL}));
  await page.goto('/sagun?category=groom');
  await expect(page.locator('#sagun-member-member-minor')).toHaveCount(0);await expect(page.locator('#sagun-member-member-son')).toBeVisible();
  const apply=page.getByRole('button',{name:hi?'सगुन हेतु आवेदन करें':'Apply for Sagun',exact:true});await expect(apply).toBeDisabled();
  await page.locator('#sagun-member-member-son').check();await apply.click();
  await expect(page.locator('#sagun-fullName')).toHaveValue('Rahul Patidar');await expect(page.locator('#sagun-candidateType')).toBeDisabled();await expect(page.locator('#sagun-candidateType')).toHaveValue('GROOM');
  await page.getByRole('button',{name:/^2\./}).click();await expect(page.locator('#sagun-education')).toHaveValue('B.Tech');await expect(page.getByText('NPSI-STU-000001')).toBeVisible();await expect(page.getByText(hi?'प्रशासक द्वारा सत्यापित किया जाएगा':'An administrator will verify these discrepancies')).toBeVisible();
  await page.getByRole('button',{name:/^1\./}).click();
  await expect(page.getByText('NPSI-FAM-000001',{exact:true})).toBeVisible();
  await page.locator('#sagun-fullName').fill('TEST CANDIDATE');
  await page.getByRole('button',{name:hi?'ड्राफ़्ट सहेजें':'Save Draft',exact:true}).click();await expect(page.getByRole('status').filter({hasText:hi?'बैकएंड':'backend'})).toContainText(hi?'बैकएंड':'backend');expect(saved.action).toBe('DRAFT');expect(saved.memberId).toBe('member-son');expect(saved.category).toBe('GROOM');expect(saved.data.candidateType).toBe('GROOM');expect(saved.data.visibility).toBe('PRIVATE');
  await expect(page.locator('#sagun-photoFileId')).toBeDisabled();await page.locator('#sagun-upload-consent').check();await page.locator('#sagun-photoFileId').setInputFiles({name:'test.png',mimeType:'image/png',buffer:png});
  await expect(page.getByRole('button',{name:hi?'निजी रूप से डाउनलोड करें':'Download privately',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:/Sagun & Marriage Ceremony Details|सगुन और विवाह समारोह का विवरण/})).toHaveCount(0);
  await page.route('https://api.postalpincode.in/**',route=>route.fulfill({json:[{Status:'Success',PostOffice:[{Name:'Pithampur',Pincode:'454775',District:'Dhar'}]}]}));
  for(const removed of ['candidateMobile','motherMobile','email','city'])await expect(page.locator(`#sagun-${removed}`)).toHaveCount(0);await expect(page.locator('#sagun-district')).toBeVisible();await expect(page.locator('#sagun-nativeVillage')).toBeVisible();
  expect((await page.locator('#sagun-nativeVillage option').evaluateAll(options=>options.map(option=>option.value))).slice(0,6)).toEqual(['','Indore','Dewas','Pithampur','Ujjain','Khargone']);
  await expect(page.locator('#sagun-nativeVillage option[value="अघावन (टेमला)"]')).toHaveText(hi?'अघावन (टेमला)':'Aghawan (Temla)');
  await expect(page.locator('#sagun-nativeVillage')).toHaveAccessibleName(hi?/^गाँव \*$/:/^Village \*$/);await expect(page.locator('#sagun-nativeVillage option')).toHaveCount(65);
  expect(await page.evaluate(()=>document.querySelector('#sagun-nativeVillage').compareDocumentPosition(document.querySelector('#sagun-district'))&Node.DOCUMENT_POSITION_FOLLOWING)).toBeTruthy();
  await page.locator('#sagun-nativeVillage').selectOption('Pithampur');await expect(page.locator('#sagun-area')).toHaveValue('Pithampur');await expect(page.locator('#sagun-district')).toHaveValue('Dhar');await expect(page.locator('#sagun-pincode')).toHaveValue('454775');
  await page.locator('#sagun-nativeVillage').selectOption('Indore');await expect(page.locator('#sagun-district')).toHaveValue('Indore');await expect(page.locator('#sagun-area')).toHaveValue('Vijay Nagar');await page.locator('#sagun-area').fill('Scheme 54');await expect(page.locator('#sagun-area')).toHaveValue('Scheme 54');await page.locator('#sagun-nativeVillage').selectOption('अघावन (टेमला)');await expect(page.locator('#sagun-nativeVillage')).toHaveValue('अघावन (टेमला)');await expect(page.locator('#sagun-area')).toHaveCount(0);await expect(page.locator('#sagun-district')).toHaveValue('Khargone');
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
  await page.goto('/sagun/workspace?category=bride');await page.getByRole('button',{name:hi?'परिचय खोजें':'Browse Profiles',exact:true}).click();await page.locator('#search-city').fill('Indore');await page.getByRole('button',{name:hi?'खोजें':'Search',exact:true}).click();await expect.poll(()=>search?.get('city')).toBe('Indore');await expect.poll(()=>search?.get('candidateType')).toBe('BRIDE');
  await page.getByRole('button',{name:hi?'परिचय देखें':'View Profile',exact:true}).click();await expect(page.locator('#sagun-inquiry-message')).toBeVisible();
  await expect(page.getByText('9000000000',{exact:true})).toHaveCount(0);await page.locator('#sagun-inquiry-message').fill('Test introduction');await page.locator('#sagun-inquiry-consent').check();
  await page.getByRole('button',{name:hi?'संपर्क अनुरोध भेजें':'Send Contact Request',exact:true}).click();await expect.poll(()=>inquiry?.consent).toBe(true);
 });
 test(`${lang}: owners can accept contact requests without sharing removed ceremony details`,async({page})=>{
  const hi=lang==='hi';await page.addInitScript(value=>localStorage.setItem('pss_lang',value),lang);const mine=empty();mine.incoming=[{id:'inquiry-1',profileId:'profile-1',profileName:'Owner Candidate',senderName:'Requesting Member',message:'Introduction',status:'PENDING',shareSagun:false,contact:null}];
  await mockApi(page,{'GET /auth/me':MEMBER,'GET /sagun/schema':schema,'GET /sagun/profiles':{records:[],hasMore:false}});
  await page.route('**/api/v1/sagun/me',route=>route.fulfill({json:mine}));let action;
  await page.route('**/api/v1/sagun/inquiries/inquiry-1',async route=>{action=route.request().postDataJSON();Object.assign(mine.incoming[0],{status:action.action==='REVOKE'?'DECLINED':'ACCEPTED',shareSagun:Boolean(action.shareSagun)});return route.fulfill({json:{ok:true}});});
  await page.goto('/sagun/workspace');await page.getByRole('button',{name:hi?'संपर्क अनुरोध':'Contact Requests',exact:true}).click();await expect(page.getByRole('checkbox')).toHaveCount(0);
  await page.getByRole('button',{name:hi?'स्वीकार करें':'Accept',exact:true}).click();await expect.poll(()=>action?.shareSagun).toBe(false);
  await page.getByRole('button',{name:hi?'अनुमति वापस लें':'Revoke Access',exact:true}).click();await expect.poll(()=>action?.action).toBe('REVOKE');
 });
}
test('direct Bride route filters family members, fixes category and pre-fills the form',async({page})=>{
 await page.setViewportSize({width:390,height:900});await page.addInitScript(()=>localStorage.setItem('pss_lang','en'));
 const daughter={id:'member-daughter',membershipId:'NPSI-MEM-000012',name:'Radhika Patidar',relationship:'Daughter',gender:'FEMALE',age:18,minimumAge:18,eligible:true,reason:null,application:null};
 const family={...FAMILY,members:[...FAMILY.members,daughter]};const prefill={member:{id:daughter.id,membershipId:daughter.membershipId,familyId:FAMILY.family.familyId,name:daughter.name,gender:'FEMALE',age:18,dob:'2008-11-10',village:'Sanawad'},eligibility:{eligible:true,reason:null},existing:null,lockedKeys:['dob','candidateType'],prefill:{fullName:daughter.name,candidateType:'BRIDE',dob:'2008-11-10',fatherName:'Ramesh Patidar',district:'Indore',city:'Indore'}};
 await mockApi(page,{'GET /auth/me':MEMBER,'GET /sagun/schema':schema,'GET /sagun/me':empty(),'GET /sagun/profiles':{records:[],hasMore:false}});let saved;
 await page.route('**/api/v1/sagun/eligible-members',route=>route.fulfill({json:family}));await page.route('**/api/v1/sagun/eligible-members/member-daughter',route=>route.fulfill({json:prefill}));
 await page.route('**/api/v1/sagun/profiles',async route=>{saved=route.request().postDataJSON();return route.fulfill({json:{id:'bride-draft',reference:'SAGUN-BRIDE',data:saved.data,status:'DRAFT',files:[]}});});
 await page.goto('/sagun?category=bride');await expect(page.getByRole('heading',{name:'Register Matrimonial Profile: Bride',level:1})).toBeVisible();await expect(page.getByText('Requirements, privacy and official guidance')).toHaveCount(0);await expect(page.getByRole('button',{name:'Browse Profiles',exact:true})).toHaveCount(0);await expect(page.locator('#sagun-member-member-daughter')).toBeVisible();await expect(page.locator('#sagun-member-member-son')).toHaveCount(0);await page.locator('#sagun-member-member-daughter').check();await page.getByRole('button',{name:'Apply for Sagun',exact:true}).click();
 await expect(page.locator('#sagun-candidateType')).toHaveValue('BRIDE');await expect(page.locator('#sagun-candidateType')).toBeDisabled();await expect(page.locator('#sagun-dob')).toBeDisabled();await expect(page.locator('#sagun-fullName')).toHaveAttribute('autocomplete','name');await expect(page.locator('#sagun-dob')).toHaveAttribute('autocomplete','bday');await page.getByRole('button',{name:'Save Draft',exact:true}).click();expect(saved.category).toBe('BRIDE');expect(saved.data.candidateType).toBe('BRIDE');expect(saved.data.dob).toBe('2008-11-10');await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('public visitors see only the selector, then the selected form; family rule appears on submit',async({page})=>{
 await mockApi(page,{'GET /auth/me':NOT_LOGGED_IN,'GET /sagun/schema':schema});
 await page.route('**/api/v1/sagun/profiles',route=>route.fulfill({status:403,json:{error:'SAGUN_MEMBER_REQUIRED'}}));
 await page.goto('/sagun');await expect(page.getByRole('radio')).toHaveCount(2);await expect(page.locator('#search-name')).toHaveCount(0);
 await page.goto('/sagun?category=groom');await expect(page.getByRole('heading',{name:'Register Matrimonial Profile: Groom',level:1})).toBeVisible();
 await expect(page.getByText('Requirements, privacy and official guidance')).toHaveCount(0);await expect(page.getByRole('heading',{name:'Sagun Registration',exact:true})).toHaveCount(0);
 await expect(page.locator('#sagun-fullName')).toBeVisible();await expect(page.getByText('Family registration on the NPS Indore portal is mandatory to submit a Sagun application. Please register your family first.')).toHaveCount(0);
 await page.getByRole('button',{name:'Submit for Approval',exact:true}).click();await expect(page.getByText('Family registration on the NPS Indore portal is mandatory to submit a Sagun application. Please register your family first.')).toBeVisible();
 await expect(page.locator('#search-name')).toHaveCount(0);
});
test('category form keeps the website shell and offers village/city choices for every district',async({page})=>{
 await mockApi(page,{'GET /auth/me':NOT_LOGGED_IN,'GET /sagun/schema':schema});
 await page.setViewportSize({width:390,height:844});await page.goto('/sagun?category=bride');
 await expect(page.locator('header')).toBeVisible();await expect(page.locator('footer')).toBeVisible();
 await page.getByRole('button',{name:/^1\./}).click();await expect(page.locator('#sagun-district')).toHaveValue('Khargone');
 await expect(page.locator('#sagun-nativeVillage')).toHaveJSProperty('tagName','SELECT');
 await expect(page.locator('#sagun-nativeVillage')).toHaveAccessibleName(/^Village \*$/);
 await expect(page.locator('#sagun-nativeVillage option')).toHaveCount(65);
 await page.locator('#sagun-nativeVillage').selectOption('अघावन (टेमला)');await expect(page.locator('#sagun-nativeVillage')).toHaveValue('अघावन (टेमला)');
});
test('admin approval and protected field configuration use real API actions',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('pss_lang','en'));const state={profiles:[{id:'profile-1',reference:'SAGUN-TEST',displayName:'Test Candidate',userId:MEMBER.id,data:{fullName:'Test Candidate'},files:[],status:'SUBMITTED',visibility:'PRIVATE'}],audits:[]};
 await mockApi(page,{'GET /auth/me':ADMIN,'GET /sagun/schema':schema});await page.route('**/api/v1/sagun/admin',route=>route.fulfill({json:state}));let review;let settings;
 await page.route('**/api/v1/sagun/admin/profiles/profile-1/review',async route=>{review=route.request().postDataJSON();state.profiles[0].status=review.status;return route.fulfill({json:{ok:true}});});
 await page.route('**/api/v1/sagun/admin/schema',async route=>{settings=route.request().postDataJSON();return route.fulfill({json:schema});});
 await page.goto('/admin/sagun');await page.getByRole('button',{name:'Profiles',exact:true}).click();await page.locator('#review-profile-1').fill('Test verified');await page.getByRole('button',{name:'Approve',exact:true}).click();await expect.poll(()=>review?.status).toBe('APPROVED');
 await page.getByRole('button',{name:'Configure Fields',exact:true}).click();await expect(page.locator('#config-dob-required')).toBeDisabled();await expect(page.locator('#config-cashSagun-required')).toHaveCount(0);
 await page.locator('#config-college-required').check();await page.getByRole('button',{name:'Save Field Configuration',exact:true}).click();await expect.poll(()=>settings?.overrides?.college?.required).toBe(true);
});

test('admin can switch into administration on the common Sagun page',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('pss_lang','en'));
 await mockApi(page,{'GET /auth/me':ADMIN,'GET /sagun/schema':schema,'GET /sagun/me':empty(),'GET /sagun/profiles':{records:[],hasMore:false},'GET /sagun/admin':{profiles:[],audits:[]}});
 await page.goto('/sagun/workspace');await page.getByRole('button',{name:'Manage Sagun here',exact:true}).click();await expect(page.getByRole('button',{name:'Configure Fields',exact:true})).toBeVisible();await expect(page).toHaveURL(/\/sagun\/workspace$/);await page.getByRole('button',{name:'Member workspace',exact:true}).click();await expect(page.getByRole('button',{name:'My Profiles',exact:true})).toBeVisible();
});
for(const lang of ['en','hi'])test(`${lang}: consent withdrawal is confirmed and removed ceremony details stay hidden`,async({page})=>{
 const hi=lang==='hi';await page.addInitScript(value=>localStorage.setItem('pss_lang',value),lang);
 const own=empty();own.profiles=[{id:'own',userId:MEMBER.id,reference:'SAGUN-PRIVATE',displayName:'Test',status:'APPROVED',visibility:'MEMBERS',data:{fullName:'Test',sagunItems:[{name:'Coconut',recipient:'BRIDE',recordStatus:'GIVEN',donorName:'Private Donor',donorRelationship:'Uncle',value:100}]},files:[]}];
 await mockApi(page,{'GET /auth/me':MEMBER,'GET /sagun/schema':schema,'GET /sagun/profiles':{records:[],hasMore:false}});
 await page.route('**/api/v1/sagun/me',route=>route.fulfill({json:own}));await page.route('**/api/v1/sagun/profiles/own',route=>route.fulfill({json:own.profiles[0]}));
 let withdrawn=false;await page.route('**/api/v1/sagun/profiles/own/consent-withdrawal',route=>{withdrawn=true;own.profiles[0].status='INACTIVE';own.profiles[0].visibility='PRIVATE';return route.fulfill({json:{ok:true}});});
 await page.goto('/sagun/workspace');await page.getByRole('button',{name:hi?'मेरे परिचय':'My Profiles',exact:true}).click();await page.getByRole('article').getByRole('button',{name:hi?'परिचय का पूर्वावलोकन':'Preview Profile',exact:true}).click();await expect(page.locator('#sagun-gift-print')).toHaveCount(0);await expect(page.getByText('Private Donor',{exact:true})).toHaveCount(0);
 page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:hi?'सहमति वापस लें':'Withdraw Consent',exact:true}).click();await expect.poll(()=>withdrawn).toBe(true);await expect(page.locator('#sagun-gift-print')).toHaveCount(0);
});

for(const lang of ['en','hi'])test(`${lang}: members without family registration see the bilingual mandatory-registration message only after submit`,async({page})=>{
 const hi=lang==='hi';await page.addInitScript(value=>localStorage.setItem('pss_lang',value),lang);
 await mockApi(page,{'GET /auth/me':MEMBER,'GET /sagun/schema':schema,'GET /sagun/me':{status:403,body:{error:'SAGUN_MEMBER_REQUIRED'}},'GET /sagun/profiles':{records:[],hasMore:false}});
 await page.route('**/api/v1/sagun/profiles',route=>route.fulfill({status:403,json:{error:'SAGUN_MEMBER_REQUIRED'}}));
 await page.goto('/sagun?category=groom');
 await expect(page.locator('#sagun-fullName')).toBeVisible();
 await expect(page.getByText(hi?'सगुन पंजीकरण हेतु आपका परिवार संगठन के पोर्टल पर पंजीकृत होना अनिवार्य है। कृपया पहले परिवार पंजीकरण करवाएं।':'Family registration on the NPS Indore portal is mandatory to submit a Sagun application. Please register your family first.')).toHaveCount(0);
 await page.getByRole('button',{name:hi?'स्वीकृति के लिए जमा करें':'Submit for Approval',exact:true}).click();
 await expect(page.getByText(hi?'सगुन पंजीकरण हेतु आपका परिवार संगठन के पोर्टल पर पंजीकृत होना अनिवार्य है। कृपया पहले परिवार पंजीकरण करवाएं।':'Family registration on the NPS Indore portal is mandatory to submit a Sagun application. Please register your family first.')).toBeVisible();
});
test('member with an existing application sees it instead of a second registration',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('pss_lang','hi'));
 const family={...FAMILY,members:[{...FAMILY.members[0],eligible:false,reason:'ALREADY_APPLIED',application:{id:'p1',status:'SUBMITTED',reference:'SAGUN-1',mine:true}}]};
 await mockApi(page,{'GET /auth/me':MEMBER,'GET /sagun/schema':schema,'GET /sagun/me':empty(),'GET /sagun/profiles':{records:[],hasMore:false},'GET /sagun/eligible-members':family});
 await page.goto('/sagun?category=groom');await expect(page.locator('#sagun-member-member-son')).toBeDisabled();await expect(page.getByText('आवेदन पहले से मौजूद है (जमा)')).toBeVisible();
});
test('submitting shows the confirmation screen',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('pss_lang','en'));
 await mockApi(page,{'GET /auth/me':MEMBER,'GET /sagun/schema':schema,'GET /sagun/me':empty(),'GET /sagun/profiles':{records:[],hasMore:false},'GET /sagun/eligible-members':FAMILY,'GET /sagun/eligible-members/member-son':PREFILL});
 let body;await page.route('**/api/v1/sagun/profiles',route=>{body=route.request().postDataJSON();return route.fulfill({json:{id:'p1',reference:'SAGUN-OK',status:'SUBMITTED',data:body.data,memberId:'member-son',files:[]}});});
 await page.goto('/sagun?category=groom');await page.locator('#sagun-member-member-son').check();await page.getByRole('button',{name:'Apply for Sagun',exact:true}).click();
 await page.getByRole('button',{name:'Submit for Approval',exact:true}).click();
 await expect(page.getByRole('heading',{name:/Application submitted/})).toBeVisible();await expect(page.getByText(/SAGUN-OK/)).toBeVisible();expect(body.memberId).toBe('member-son');expect(body.category).toBe('GROOM');expect(body.data.candidateType).toBe('GROOM');expect(body.action).toBe('SUBMIT');
});
test('admin dashboard shows statistics, filters by status and exports',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('pss_lang','en'));
 const record={id:'p1',reference:'SAGUN-1',displayName:'Rahul Patidar',familyId:'NPSI-FAM-000001',membershipId:'NPSI-MEM-000010',candidateType:'GROOM',age:25,village:'Sanawad',education:'B.E.',occupation:'Engineer',status:'SUBMITTED',submittedAt:'2026-11-01T00:00:00Z',files:[],data:{dob:'2001-01-01'}};
 const calls=await mockApi(page,{'GET /auth/me':ADMIN,'GET /sagun/schema':schema,'GET /sagun/admin':{profiles:[],audits:[]},'GET /sagun/admin/stats':{total:7,drafts:1,pending:3,submitted:2,underReview:1,approved:2,rejected:1,inactive:1,male:4,female:3},'GET /sagun/admin/profiles':{total:1,records:[record]}});
 let review;await page.route('**/api/v1/sagun/admin/profiles/p1/review',route=>{review=route.request().postDataJSON();return route.fulfill({json:{ok:true}});});
 await page.goto('/admin/sagun');await expect(page.getByText('Total Applications')).toBeVisible();await expect(page.getByRole('cell',{name:'NPSI-MEM-000010'})).toBeVisible();
 await page.locator('#sagun-admin-status').selectOption('SUBMITTED');await page.getByRole('button',{name:'Apply Filters',exact:true}).click();
 await expect.poll(()=>calls.filter(call=>call.key==='GET /sagun/admin/profiles').some(call=>call.query.includes('status=SUBMITTED'))).toBe(true);
 await page.getByRole('button',{name:'Admin Verification Notes',exact:true}).click();await page.getByRole('button',{name:'Reject',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('Remarks are required');expect(review).toBeUndefined();
 await page.locator('#sagun-remarks-p1').fill('Photo unclear');await page.getByRole('button',{name:'Reject',exact:true}).click();await expect.poll(()=>review?.status).toBe('REJECTED');expect(review.notes).toBe('Photo unclear');
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export to Excel',exact:true}).click();expect((await download).suggestedFilename()).toMatch(/sagun-applications-.*\.xlsx$/);
});
