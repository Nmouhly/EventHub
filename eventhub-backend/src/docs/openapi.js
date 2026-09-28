const ref = name => ({ $ref: `#/components/schemas/${name}` });
const str = {type:'string'};
const uuid = {type:'string',format:'uuid'};
const date = {type:'string',format:'date-time'};
const integer = {type:'integer',minimum:0};
const object = (properties,required=Object.keys(properties)) => ({type:'object',properties,required});
const input = (properties,required) => ({...object(properties,required),additionalProperties:false});
const nullable = schema => ({...schema,nullable:true});
const eventStatus = {type:'string',enum:['draft','published','cancelled']};
const registrationStatus = {type:'string',enum:['pending','confirmed','cancelled']};
const role = {type:'string',enum:['admin','staff']};
const fullName = {type:'string',minLength:1,maxLength:200};
const email = {type:'string',format:'email',maxLength:254,description:'Normalisé en minuscules, espaces périphériques retirés.'};
const profile = {id:uuid,fullName:str,name:str,email,role};
const eventFields = {title:fullName,description:nullable({type:'string',maxLength:10000}),location:{type:'string',minLength:1,maxLength:500},eventDate:date,maxParticipants:{type:'integer',minimum:1,maximum:2147483647}};
const participantFields = {fullName,email,phone:nullable({type:'string',maxLength:40})};
const userFields = {fullName,email,role,isActive:{type:'boolean'}};
const schemas = {
  Profile:object(profile),
  Login:input({email,password:{type:'string',minLength:1,maxLength:200,writeOnly:true,description:'Maximum 72 octets UTF-8.'}},['email','password']),
  LoginResult:object({token:{type:'string',description:'JWT à copier dans Authorize, sans préfixe Bearer.'},user:ref('Profile')}),
  EventInput:input(eventFields,['title','location','eventDate','maxParticipants']),
  Event:object({id:uuid,...eventFields,status:eventStatus,createdBy:object({id:uuid,fullName:str,name:str,email}),registeredParticipants:integer,cancelledAt:nullable(date),createdAt:date,updatedAt:date}),
  ParticipantInput:input(participantFields,['fullName','email']),
  Participant:object({id:uuid,...participantFields,createdAt:date,updatedAt:date}),
  RegistrationInput:input({eventId:uuid,participantId:uuid}),
  Registration:object({id:uuid,eventId:uuid,participantId:uuid,status:registrationStatus,cancelledAt:nullable(date),createdAt:date,updatedAt:date,participant:object({id:uuid,fullName:str,email}),event:object({id:uuid,title:str,status:eventStatus})}),
  EventStatusInput:input({status:eventStatus}),
  RegistrationStatusInput:input({status:registrationStatus}),
  UserInput:input(userFields),
  NewUser:input({...userFields,password:{type:'string',minLength:12,maxLength:72,writeOnly:true,description:'12 caractères minimum ; 72 octets UTF-8 maximum. Hash bcrypt côté serveur.'}}),
  User:object({id:uuid,...userFields,createdAt:date}),
  Pagination:object({page:{type:'integer',minimum:1},limit:{type:'integer',minimum:1,maximum:100},total:integer,totalPages:integer}),
  Error:object({success:{type:'boolean',enum:[false]},error:object({code:str,message:str,details:{type:'array',items:object({field:str,message:str})}},['code','message'])}),
  Dashboard:object({totalEvents:integer,publishedEvents:integer,todayRegistrations:integer,totalParticipants:integer,topEvents:{type:'array',maxItems:5,items:{allOf:[ref('Event'),object({fillRate:{type:'number',minimum:0,maximum:100}})]}},upcomingEvents:{type:'array',maxItems:4,items:ref('Event')}}),
};
for(const name of ['Event','Participant','Registration','User']) schemas[`${name}List`]=object({data:{type:'array',items:ref(name)},total:integer,pagination:ref('Pagination')});
const response = (description,schema)=>({description,content:{'application/json':{schema}}});
const errors = {
  400:response('VALIDATION_ERROR : champs inconnus, UUID, email, date, capacité, pagination ou JSON invalide.',ref('Error')),
  401:response('UNAUTHORIZED : identifiants invalides, JWT absent/expiré ou compte désactivé.',ref('Error')),
  403:response('FORBIDDEN : rôle ou origine non autorisés.',ref('Error')),
  404:response('NOT_FOUND, EVENT_NOT_FOUND, PARTICIPANT_NOT_FOUND, REGISTRATION_NOT_FOUND ou USER_NOT_FOUND.',ref('Error')),
  409:response('Conflit métier. Consulter les codes décrits pour cette opération.',ref('Error')),
  413:response('PAYLOAD_TOO_LARGE : JSON supérieur à 100 Ko.',ref('Error')),
  500:response('INTERNAL_ERROR : erreur inattendue, sans détails SQL ni stack.',ref('Error')),
};
const parameter=(name,schema,description)=>({name,in:'query',schema,description});
const paging=[parameter('page',{type:'integer',minimum:1,maximum:1000000,default:1}),parameter('limit',{type:'integer',minimum:1,maximum:100,default:10})];
const search=parameter('search',{type:'string',maxLength:200},'Recherche littérale insensible à la casse ; %, _ et antislash sont échappés.');
const id={name:'id',in:'path',required:true,schema:uuid};
const body=(name,example)=>({required:true,content:{'application/json':{schema:ref(name),...(example&&{example})}}});
function operation(tag,operationId,summary,schema,{status=200,description='',parameters=[],requestBody,publicRoute=false,codes=[400,401,403,404,409,500]}={}) {
  return {tags:[tag],operationId,summary,description,parameters,...(requestBody&&{requestBody}),...(publicRoute&&{security:[]}),responses:{[status]:status===204?{description:'Suppression réussie, corps vide.'}:response('Succès',ref(schema)),...Object.fromEntries(codes.map(code=>[code,errors[code]]))}};
}
const eventExample={title:'Atelier découverte',description:'Présentation de la communauté.',location:'Casablanca',eventDate:'2030-05-25T14:00:00Z',maxParticipants:20};
export const openapi = {
  openapi:'3.0.3',
  info:{title:'EventHub API',version:'1.0.0',description:'API de gestion interne des événements.\n\n1. Ouvrir POST /auth/login, puis Try it out et Execute.\n2. Copier le champ token de la réponse.\n3. Cliquer Authorize et coller uniquement le JWT.\n4. Tester les routes protégées. Les opérateurs internes sont distincts des participants.\n\nLes actions Execute modifient réellement la base active. Les comptes de démonstration existent uniquement si le seed a été exécuté. Le token reste en mémoire de la page et disparaît au rechargement.'},
  servers:[{url:'/api',description:'API sur la même origine (local ou proxy Docker)'}],
  security:[{bearerAuth:[]}],
  tags:[{name:'Health'},{name:'Auth'},{name:'Events'},{name:'Participants'},{name:'Registrations'},{name:'Dashboard'},{name:'Users',description:'Admin uniquement. Comptes internes, sans suppression définitive.'}],
  components:{securitySchemes:{bearerAuth:{type:'http',scheme:'bearer',bearerFormat:'JWT'}},schemas},
  paths:{
    '/health':{get:{tags:['Health'],operationId:'health',summary:'Vérifier la connexion PostgreSQL',security:[],responses:{200:response('API et DB accessibles',object({status:{type:'string',enum:['ok']}})),500:errors[500]}}},
    '/auth/login':{post:{...operation('Auth','login','Se connecter','LoginResult',{publicRoute:true,requestBody:body('Login',{email:'admin@eventhub.demo',password:'EventHub2026!'}),codes:[400,401,403,413,500]}),responses:{...operation('Auth','login','Se connecter','LoginResult',{publicRoute:true,codes:[400,401,403,413,500]}).responses,429:response('TOO_MANY_REQUESTS : 50 échecs / 15 minutes / IP.',ref('Error'))}}},
    '/auth/me':{get:operation('Auth','me','Consulter le profil courant','Profile',{codes:[401,403,500]})},
    '/events':{
      get:operation('Events','listEvents','Lister et filtrer les événements','EventList',{parameters:[...paging,search,parameter('status',eventStatus),parameter('date',{type:'string',format:'date'},'Journée dans APP_TIMEZONE, Africa/Casablanca par défaut.')],codes:[400,401,403,500]}),
      post:operation('Events','createEvent','Créer un brouillon','Event',{status:201,requestBody:body('EventInput',eventExample),description:'createdBy est dérivé du JWT. Ne pas envoyer createdBy ni status.',codes:[400,401,403,413,500]}),
    },
    '/events/{id}':{
      get:operation('Events','getEvent','Détail et capacité active','Event',{parameters:[id],codes:[400,401,403,404,500]}),
      put:operation('Events','updateEvent','Modifier un événement','Event',{parameters:[id],requestBody:body('EventInput',eventExample),description:'PUT exige les champs obligatoires. MAX_PARTICIPANTS_TOO_LOW si la capacité est inférieure aux inscriptions pending + confirmed.',codes:[400,401,403,404,409,413,500]}),
    },
    '/events/{id}/status':{patch:operation('Events','changeEventStatus','Publier ou annuler un événement','Event',{parameters:[id],requestBody:body('EventStatusInput',{status:'published'}),description:'draft → published/cancelled ; published → cancelled. cancelled est terminal. INVALID_EVENT_STATUS_TRANSITION pour toute autre transition. Annulation atomique de toutes les inscriptions, sous verrou événement.'})},
    '/participants':{
      get:operation('Participants','listParticipants','Rechercher les participants','ParticipantList',{parameters:[...paging,search],codes:[400,401,403,500]}),
      post:operation('Participants','createParticipant','Créer un participant externe','Participant',{status:201,requestBody:body('ParticipantInput',{fullName:'Sam Exemple',email:'sam@example.com',phone:null}),description:'EMAIL_ALREADY_EXISTS si email déjà utilisé. Aucun compte utilisateur ni mot de passe.',codes:[400,401,403,409,413,500]}),
    },
    '/participants/{id}':{
      get:operation('Participants','getParticipant','Consulter un participant','Participant',{parameters:[id],codes:[400,401,403,404,500]}),
      put:operation('Participants','updateParticipant','Modifier un participant','Participant',{parameters:[id],requestBody:body('ParticipantInput'),description:'EMAIL_ALREADY_EXISTS en cas de doublon.',codes:[400,401,403,404,409,413,500]}),
      delete:operation('Participants','deleteParticipant','Supprimer un participant sans inscription',null,{status:204,parameters:[id],description:'PARTICIPANT_HAS_REGISTRATIONS si une inscription existe, même annulée.'}),
    },
    '/registrations':{
      get:operation('Registrations','listRegistrations','Lister les inscriptions','RegistrationList',{parameters:[...paging,parameter('eventId',uuid),parameter('participantId',uuid),parameter('status',registrationStatus)],codes:[400,401,403,500]}),
      post:operation('Registrations','createRegistration','Inscrire ou réactiver un participant','Registration',{status:201,requestBody:body('RegistrationInput'),description:'Événement publié requis. Pending consomme une place. EVENT_NOT_PUBLISHED, EVENT_FULL, ALREADY_REGISTERED. Une inscription annulée est réactivée sur la même ligne en pending (201). Transaction et SELECT FOR UPDATE protègent la dernière place.'}),
    },
    '/registrations/{id}/status':{patch:operation('Registrations','changeRegistrationStatus','Changer le statut d’une inscription','Registration',{parameters:[id],requestBody:body('RegistrationStatusInput',{status:'confirmed'}),description:'pending → confirmed/cancelled ; confirmed → cancelled ; cancelled → pending/confirmed. Réactivation : publication et capacité revérifiées. INVALID_REGISTRATION_STATUS_TRANSITION, EVENT_NOT_PUBLISHED ou EVENT_FULL.'})},
    '/dashboard':{get:operation('Dashboard','dashboard','Statistiques et événements à venir','Dashboard',{codes:[401,403,500],description:'Top 5 published selon taux de remplissage pending + confirmed. Inscriptions du jour selon APP_TIMEZONE. Une réactivation conserve createdAt.'})},
    '/users':{
      get:operation('Users','listUsers','Admin : rechercher les opérateurs','UserList',{parameters:[...paging,search],codes:[400,401,403,500]}),
      post:operation('Users','createUser','Admin : créer un compte interne','User',{status:201,requestBody:body('NewUser'),description:'Mot de passe haché avec bcrypt, jamais retourné. EMAIL_ALREADY_EXISTS si doublon.',codes:[400,401,403,409,413,500]}),
    },
    '/users/{id}':{put:operation('Users','updateUser','Admin : modifier ou désactiver un compte','User',{parameters:[id],requestBody:body('UserInput'),description:'La désactivation bloque les JWT existants. Pas de modification du mot de passe ici. SELF_ACCESS_CHANGE : auto-désactivation/rétrogradation interdite. LAST_ADMIN : un admin actif doit rester. EMAIL_ALREADY_EXISTS si doublon.',codes:[400,401,403,404,409,413,500]})},
  },
};
