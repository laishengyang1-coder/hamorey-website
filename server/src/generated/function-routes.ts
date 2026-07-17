import * as route0 from '../../../functions/api/admin/claim-parts.ts';
import * as route1 from '../../../functions/api/admin/claim-prices.ts';
import * as route2 from '../../../functions/api/admin/content-entries.ts';
import * as route3 from '../../../functions/api/admin/dashboard.ts';
import * as route4 from '../../../functions/api/admin/exports.ts';
import * as route5 from '../../../functions/api/admin/operation-logs.ts';
import * as route6 from '../../../functions/api/admin/organizations.ts';
import * as route7 from '../../../functions/api/admin/organizations/[id].ts';
import * as route8 from '../../../functions/api/admin/partner-leads.ts';
import * as route9 from '../../../functions/api/admin/partner-leads/[id].ts';
import * as route10 from '../../../functions/api/admin/points-ledger.ts';
import * as route11 from '../../../functions/api/admin/points-ledger/adjust.ts';
import * as route12 from '../../../functions/api/admin/points-rules.ts';
import * as route13 from '../../../functions/api/admin/points-rules/[id].ts';
import * as route14 from '../../../functions/api/admin/product-models.ts';
import * as route15 from '../../../functions/api/admin/product-models/[id].ts';
import * as route16 from '../../../functions/api/admin/products.ts';
import * as route17 from '../../../functions/api/admin/rebate-rules.ts';
import * as route18 from '../../../functions/api/admin/rebate-rules/[id].ts';
import * as route19 from '../../../functions/api/admin/redemptions.ts';
import * as route20 from '../../../functions/api/admin/redemptions/[id]/approve.ts';
import * as route21 from '../../../functions/api/admin/redemptions/[id]/reject.ts';
import * as route22 from '../../../functions/api/admin/redemptions/[id]/ship.ts';
import * as route23 from '../../../functions/api/admin/reviews-[id].ts';
import * as route24 from '../../../functions/api/admin/reviews.ts';
import * as route25 from '../../../functions/api/admin/reviews/[id].ts';
import * as route26 from '../../../functions/api/admin/reviews/[id]/approve.ts';
import * as route27 from '../../../functions/api/admin/reviews/[id]/reject.ts';
import * as route28 from '../../../functions/api/admin/rewards.ts';
import * as route29 from '../../../functions/api/admin/rewards/[id].ts';
import * as route30 from '../../../functions/api/admin/store-public-profiles.ts';
import * as route31 from '../../../functions/api/admin/store-public-profiles/[id].ts';
import * as route32 from '../../../functions/api/admin/store-public.ts';
import * as route33 from '../../../functions/api/admin/system-settings.ts';
import * as route34 from '../../../functions/api/admin/system-settings/[id].ts';
import * as route35 from '../../../functions/api/admin/upload-url.ts';
import * as route36 from '../../../functions/api/admin/users.ts';
import * as route37 from '../../../functions/api/admin/warranty-codes-allocate.ts';
import * as route38 from '../../../functions/api/admin/warranty-codes-import.ts';
import * as route39 from '../../../functions/api/admin/warranty-codes-revoke.ts';
import * as route40 from '../../../functions/api/admin/warranty-codes.ts';
import * as route41 from '../../../functions/api/admin/warranty-codes/allocate.ts';
import * as route42 from '../../../functions/api/admin/warranty-codes/import.ts';
import * as route43 from '../../../functions/api/admin/warranty-codes/revoke.ts';
import * as route44 from '../../../functions/api/admin/warranty-record-list.ts';
import * as route45 from '../../../functions/api/admin/warranty-records-[id].ts';
import * as route46 from '../../../functions/api/admin/warranty-records.ts';
import * as route47 from '../../../functions/api/admin/warranty-records/[id].ts';
import * as route48 from '../../../functions/api/auth/login.ts';
import * as route49 from '../../../functions/api/auth/logout.ts';
import * as route50 from '../../../functions/api/auth/me.ts';
import * as route51 from '../../../functions/api/contact.ts';
import * as route52 from '../../../functions/api/health.ts';
import * as route53 from '../../../functions/api/partner-leads.ts';
import * as route54 from '../../../functions/api/province/account.ts';
import * as route55 from '../../../functions/api/province/addresses.ts';
import * as route56 from '../../../functions/api/province/addresses/[id].ts';
import * as route57 from '../../../functions/api/province/dashboard.ts';
import * as route58 from '../../../functions/api/province/organizations.ts';
import * as route59 from '../../../functions/api/province/organizations/[id].ts';
import * as route60 from '../../../functions/api/province/points.ts';
import * as route61 from '../../../functions/api/province/redemptions.ts';
import * as route62 from '../../../functions/api/province/rewards.ts';
import * as route63 from '../../../functions/api/province/warranty-codes.ts';
import * as route64 from '../../../functions/api/province/warranty-codes/allocate.ts';
import * as route65 from '../../../functions/api/province/warranty-records-[id].ts';
import * as route66 from '../../../functions/api/province/warranty-records.ts';
import * as route67 from '../../../functions/api/province/warranty-records/[id].ts';
import * as route68 from '../../../functions/api/public/certificates.ts';
import * as route69 from '../../../functions/api/public/certificates/[[path]].ts';
import * as route70 from '../../../functions/api/public/claim-prices.ts';
import * as route71 from '../../../functions/api/public/photos/[[path]].ts';
import * as route72 from '../../../functions/api/public/warranties.ts';
import * as route73 from '../../../functions/api/r2-upload/[[path]].ts';
import * as route74 from '../../../functions/api/store/account.ts';
import * as route75 from '../../../functions/api/store/addresses.ts';
import * as route76 from '../../../functions/api/store/addresses/[id].ts';
import * as route77 from '../../../functions/api/store/dashboard.ts';
import * as route78 from '../../../functions/api/store/points.ts';
import * as route79 from '../../../functions/api/store/redemptions.ts';
import * as route80 from '../../../functions/api/store/rewards.ts';
import * as route81 from '../../../functions/api/store/upload-url.ts';
import * as route82 from '../../../functions/api/store/warranty-codes.ts';
import * as route83 from '../../../functions/api/store/warranty-records-[id].ts';
import * as route84 from '../../../functions/api/store/warranty-records.ts';
import * as route85 from '../../../functions/api/store/warranty-records/[id].ts';
import * as route86 from '../../../functions/api/stores.ts';
import * as route87 from '../../../functions/api/warranty-search.ts';

export type RouteSegment =
  | { kind: 'static'; value: string }
  | { kind: 'param'; name: string }
  | { kind: 'embeddedParam'; prefix: string; name: string; suffix: string }
  | { kind: 'catchAll'; name: string };

export interface FunctionRouteDefinition {
  path: string;
  score: number;
  segments: RouteSegment[];
  module: Record<string, unknown>;
}

export const functionRoutes: FunctionRouteDefinition[] = [
  {
    path: "/api/admin/redemptions/:id/approve",
    score: 144,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"redemptions"},{"kind":"param","name":"id"},{"kind":"static","value":"approve"}],
    module: route20,
  },
  {
    path: "/api/admin/redemptions/:id/reject",
    score: 144,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"redemptions"},{"kind":"param","name":"id"},{"kind":"static","value":"reject"}],
    module: route21,
  },
  {
    path: "/api/admin/redemptions/:id/ship",
    score: 144,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"redemptions"},{"kind":"param","name":"id"},{"kind":"static","value":"ship"}],
    module: route22,
  },
  {
    path: "/api/admin/reviews/:id/approve",
    score: 144,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"reviews"},{"kind":"param","name":"id"},{"kind":"static","value":"approve"}],
    module: route26,
  },
  {
    path: "/api/admin/reviews/:id/reject",
    score: 144,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"reviews"},{"kind":"param","name":"id"},{"kind":"static","value":"reject"}],
    module: route27,
  },
  {
    path: "/api/admin/points-ledger/adjust",
    score: 123,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"points-ledger"},{"kind":"static","value":"adjust"}],
    module: route11,
  },
  {
    path: "/api/admin/warranty-codes/allocate",
    score: 123,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"warranty-codes"},{"kind":"static","value":"allocate"}],
    module: route41,
  },
  {
    path: "/api/admin/warranty-codes/import",
    score: 123,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"warranty-codes"},{"kind":"static","value":"import"}],
    module: route42,
  },
  {
    path: "/api/admin/warranty-codes/revoke",
    score: 123,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"warranty-codes"},{"kind":"static","value":"revoke"}],
    module: route43,
  },
  {
    path: "/api/province/warranty-codes/allocate",
    score: 123,
    segments: [{"kind":"static","value":"province"},{"kind":"static","value":"warranty-codes"},{"kind":"static","value":"allocate"}],
    module: route64,
  },
  {
    path: "/api/admin/organizations/:id",
    score: 103,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"organizations"},{"kind":"param","name":"id"}],
    module: route7,
  },
  {
    path: "/api/admin/partner-leads/:id",
    score: 103,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"partner-leads"},{"kind":"param","name":"id"}],
    module: route9,
  },
  {
    path: "/api/admin/points-rules/:id",
    score: 103,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"points-rules"},{"kind":"param","name":"id"}],
    module: route13,
  },
  {
    path: "/api/admin/product-models/:id",
    score: 103,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"product-models"},{"kind":"param","name":"id"}],
    module: route15,
  },
  {
    path: "/api/admin/rebate-rules/:id",
    score: 103,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"rebate-rules"},{"kind":"param","name":"id"}],
    module: route18,
  },
  {
    path: "/api/admin/reviews/:id",
    score: 103,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"reviews"},{"kind":"param","name":"id"}],
    module: route25,
  },
  {
    path: "/api/admin/rewards/:id",
    score: 103,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"rewards"},{"kind":"param","name":"id"}],
    module: route29,
  },
  {
    path: "/api/admin/store-public-profiles/:id",
    score: 103,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"store-public-profiles"},{"kind":"param","name":"id"}],
    module: route31,
  },
  {
    path: "/api/admin/system-settings/:id",
    score: 103,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"system-settings"},{"kind":"param","name":"id"}],
    module: route34,
  },
  {
    path: "/api/admin/warranty-records/:id",
    score: 103,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"warranty-records"},{"kind":"param","name":"id"}],
    module: route47,
  },
  {
    path: "/api/province/addresses/:id",
    score: 103,
    segments: [{"kind":"static","value":"province"},{"kind":"static","value":"addresses"},{"kind":"param","name":"id"}],
    module: route56,
  },
  {
    path: "/api/province/organizations/:id",
    score: 103,
    segments: [{"kind":"static","value":"province"},{"kind":"static","value":"organizations"},{"kind":"param","name":"id"}],
    module: route59,
  },
  {
    path: "/api/province/warranty-records/:id",
    score: 103,
    segments: [{"kind":"static","value":"province"},{"kind":"static","value":"warranty-records"},{"kind":"param","name":"id"}],
    module: route67,
  },
  {
    path: "/api/store/addresses/:id",
    score: 103,
    segments: [{"kind":"static","value":"store"},{"kind":"static","value":"addresses"},{"kind":"param","name":"id"}],
    module: route76,
  },
  {
    path: "/api/store/warranty-records/:id",
    score: 103,
    segments: [{"kind":"static","value":"store"},{"kind":"static","value":"warranty-records"},{"kind":"param","name":"id"}],
    module: route85,
  },
  {
    path: "/api/public/certificates/:path*",
    score: 83,
    segments: [{"kind":"static","value":"public"},{"kind":"static","value":"certificates"},{"kind":"catchAll","name":"path"}],
    module: route69,
  },
  {
    path: "/api/public/photos/:path*",
    score: 83,
    segments: [{"kind":"static","value":"public"},{"kind":"static","value":"photos"},{"kind":"catchAll","name":"path"}],
    module: route71,
  },
  {
    path: "/api/admin/claim-parts",
    score: 82,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"claim-parts"}],
    module: route0,
  },
  {
    path: "/api/admin/claim-prices",
    score: 82,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"claim-prices"}],
    module: route1,
  },
  {
    path: "/api/admin/content-entries",
    score: 82,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"content-entries"}],
    module: route2,
  },
  {
    path: "/api/admin/dashboard",
    score: 82,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"dashboard"}],
    module: route3,
  },
  {
    path: "/api/admin/exports",
    score: 82,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"exports"}],
    module: route4,
  },
  {
    path: "/api/admin/operation-logs",
    score: 82,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"operation-logs"}],
    module: route5,
  },
  {
    path: "/api/admin/organizations",
    score: 82,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"organizations"}],
    module: route6,
  },
  {
    path: "/api/admin/partner-leads",
    score: 82,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"partner-leads"}],
    module: route8,
  },
  {
    path: "/api/admin/points-ledger",
    score: 82,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"points-ledger"}],
    module: route10,
  },
  {
    path: "/api/admin/points-rules",
    score: 82,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"points-rules"}],
    module: route12,
  },
  {
    path: "/api/admin/product-models",
    score: 82,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"product-models"}],
    module: route14,
  },
  {
    path: "/api/admin/products",
    score: 82,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"products"}],
    module: route16,
  },
  {
    path: "/api/admin/rebate-rules",
    score: 82,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"rebate-rules"}],
    module: route17,
  },
  {
    path: "/api/admin/redemptions",
    score: 82,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"redemptions"}],
    module: route19,
  },
  {
    path: "/api/admin/reviews",
    score: 82,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"reviews"}],
    module: route24,
  },
  {
    path: "/api/admin/rewards",
    score: 82,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"rewards"}],
    module: route28,
  },
  {
    path: "/api/admin/store-public",
    score: 82,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"store-public"}],
    module: route32,
  },
  {
    path: "/api/admin/store-public-profiles",
    score: 82,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"store-public-profiles"}],
    module: route30,
  },
  {
    path: "/api/admin/system-settings",
    score: 82,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"system-settings"}],
    module: route33,
  },
  {
    path: "/api/admin/upload-url",
    score: 82,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"upload-url"}],
    module: route35,
  },
  {
    path: "/api/admin/users",
    score: 82,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"users"}],
    module: route36,
  },
  {
    path: "/api/admin/warranty-codes",
    score: 82,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"warranty-codes"}],
    module: route40,
  },
  {
    path: "/api/admin/warranty-codes-allocate",
    score: 82,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"warranty-codes-allocate"}],
    module: route37,
  },
  {
    path: "/api/admin/warranty-codes-import",
    score: 82,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"warranty-codes-import"}],
    module: route38,
  },
  {
    path: "/api/admin/warranty-codes-revoke",
    score: 82,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"warranty-codes-revoke"}],
    module: route39,
  },
  {
    path: "/api/admin/warranty-record-list",
    score: 82,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"warranty-record-list"}],
    module: route44,
  },
  {
    path: "/api/admin/warranty-records",
    score: 82,
    segments: [{"kind":"static","value":"admin"},{"kind":"static","value":"warranty-records"}],
    module: route46,
  },
  {
    path: "/api/auth/login",
    score: 82,
    segments: [{"kind":"static","value":"auth"},{"kind":"static","value":"login"}],
    module: route48,
  },
  {
    path: "/api/auth/logout",
    score: 82,
    segments: [{"kind":"static","value":"auth"},{"kind":"static","value":"logout"}],
    module: route49,
  },
  {
    path: "/api/auth/me",
    score: 82,
    segments: [{"kind":"static","value":"auth"},{"kind":"static","value":"me"}],
    module: route50,
  },
  {
    path: "/api/province/account",
    score: 82,
    segments: [{"kind":"static","value":"province"},{"kind":"static","value":"account"}],
    module: route54,
  },
  {
    path: "/api/province/addresses",
    score: 82,
    segments: [{"kind":"static","value":"province"},{"kind":"static","value":"addresses"}],
    module: route55,
  },
  {
    path: "/api/province/dashboard",
    score: 82,
    segments: [{"kind":"static","value":"province"},{"kind":"static","value":"dashboard"}],
    module: route57,
  },
  {
    path: "/api/province/organizations",
    score: 82,
    segments: [{"kind":"static","value":"province"},{"kind":"static","value":"organizations"}],
    module: route58,
  },
  {
    path: "/api/province/points",
    score: 82,
    segments: [{"kind":"static","value":"province"},{"kind":"static","value":"points"}],
    module: route60,
  },
  {
    path: "/api/province/redemptions",
    score: 82,
    segments: [{"kind":"static","value":"province"},{"kind":"static","value":"redemptions"}],
    module: route61,
  },
  {
    path: "/api/province/rewards",
    score: 82,
    segments: [{"kind":"static","value":"province"},{"kind":"static","value":"rewards"}],
    module: route62,
  },
  {
    path: "/api/province/warranty-codes",
    score: 82,
    segments: [{"kind":"static","value":"province"},{"kind":"static","value":"warranty-codes"}],
    module: route63,
  },
  {
    path: "/api/province/warranty-records",
    score: 82,
    segments: [{"kind":"static","value":"province"},{"kind":"static","value":"warranty-records"}],
    module: route66,
  },
  {
    path: "/api/public/certificates",
    score: 82,
    segments: [{"kind":"static","value":"public"},{"kind":"static","value":"certificates"}],
    module: route68,
  },
  {
    path: "/api/public/claim-prices",
    score: 82,
    segments: [{"kind":"static","value":"public"},{"kind":"static","value":"claim-prices"}],
    module: route70,
  },
  {
    path: "/api/public/warranties",
    score: 82,
    segments: [{"kind":"static","value":"public"},{"kind":"static","value":"warranties"}],
    module: route72,
  },
  {
    path: "/api/store/account",
    score: 82,
    segments: [{"kind":"static","value":"store"},{"kind":"static","value":"account"}],
    module: route74,
  },
  {
    path: "/api/store/addresses",
    score: 82,
    segments: [{"kind":"static","value":"store"},{"kind":"static","value":"addresses"}],
    module: route75,
  },
  {
    path: "/api/store/dashboard",
    score: 82,
    segments: [{"kind":"static","value":"store"},{"kind":"static","value":"dashboard"}],
    module: route77,
  },
  {
    path: "/api/store/points",
    score: 82,
    segments: [{"kind":"static","value":"store"},{"kind":"static","value":"points"}],
    module: route78,
  },
  {
    path: "/api/store/redemptions",
    score: 82,
    segments: [{"kind":"static","value":"store"},{"kind":"static","value":"redemptions"}],
    module: route79,
  },
  {
    path: "/api/store/rewards",
    score: 82,
    segments: [{"kind":"static","value":"store"},{"kind":"static","value":"rewards"}],
    module: route80,
  },
  {
    path: "/api/store/upload-url",
    score: 82,
    segments: [{"kind":"static","value":"store"},{"kind":"static","value":"upload-url"}],
    module: route81,
  },
  {
    path: "/api/store/warranty-codes",
    score: 82,
    segments: [{"kind":"static","value":"store"},{"kind":"static","value":"warranty-codes"}],
    module: route82,
  },
  {
    path: "/api/store/warranty-records",
    score: 82,
    segments: [{"kind":"static","value":"store"},{"kind":"static","value":"warranty-records"}],
    module: route84,
  },
  {
    path: "/api/admin/reviews-:id",
    score: 72,
    segments: [{"kind":"static","value":"admin"},{"kind":"embeddedParam","prefix":"reviews-","name":"id","suffix":""}],
    module: route23,
  },
  {
    path: "/api/admin/warranty-records-:id",
    score: 72,
    segments: [{"kind":"static","value":"admin"},{"kind":"embeddedParam","prefix":"warranty-records-","name":"id","suffix":""}],
    module: route45,
  },
  {
    path: "/api/province/warranty-records-:id",
    score: 72,
    segments: [{"kind":"static","value":"province"},{"kind":"embeddedParam","prefix":"warranty-records-","name":"id","suffix":""}],
    module: route65,
  },
  {
    path: "/api/store/warranty-records-:id",
    score: 72,
    segments: [{"kind":"static","value":"store"},{"kind":"embeddedParam","prefix":"warranty-records-","name":"id","suffix":""}],
    module: route83,
  },
  {
    path: "/api/r2-upload/:path*",
    score: 42,
    segments: [{"kind":"static","value":"r2-upload"},{"kind":"catchAll","name":"path"}],
    module: route73,
  },
  {
    path: "/api/contact",
    score: 41,
    segments: [{"kind":"static","value":"contact"}],
    module: route51,
  },
  {
    path: "/api/health",
    score: 41,
    segments: [{"kind":"static","value":"health"}],
    module: route52,
  },
  {
    path: "/api/partner-leads",
    score: 41,
    segments: [{"kind":"static","value":"partner-leads"}],
    module: route53,
  },
  {
    path: "/api/stores",
    score: 41,
    segments: [{"kind":"static","value":"stores"}],
    module: route86,
  },
  {
    path: "/api/warranty-search",
    score: 41,
    segments: [{"kind":"static","value":"warranty-search"}],
    module: route87,
  }
];
