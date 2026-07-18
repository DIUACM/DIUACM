import { z } from "zod";

import { pageFields } from "../lib/pagination";

export const trackersListQuery = z.object({ ...pageFields });
