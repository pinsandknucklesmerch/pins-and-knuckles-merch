import "server-only";

import { createMondaySalesSyncCronHandler } from "../../../../features/sales-dashboard/server/mondaySalesCronHandler.ts";

export const GET = createMondaySalesSyncCronHandler();
