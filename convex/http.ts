import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// POST /api/exercises - Create new exercise
http.route({
  path: "/api/exercises",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return new Response("Unauthorized", { status: 401 });
    }

    try {
      const body = await request.json();
      const { name } = body;

      if (!name || typeof name !== "string") {
        return new Response(
          JSON.stringify({ error: "Exercise name is required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const exerciseId = await ctx.runMutation(api.exercises.createExercise, {
        name,
      });

      // Fetch created exercise to return full object
      const created = await ctx.runQuery(api.exercises.getExercise, {
        id: exerciseId,
      });

      return new Response(
        JSON.stringify({
          id: created?._id,
          name: created?.name,
          createdAt: created?.createdAt,
          deletedAt: created?.deletedAt,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error:
            error instanceof Error
              ? error.message
              : "Failed to create exercise",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

// GET /api/exercises - List exercises
http.route({
  path: "/api/exercises",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return new Response("Unauthorized", { status: 401 });
    }

    try {
      const url = new URL(request.url);
      const includeDeleted = url.searchParams.get("includeDeleted") === "true";

      const exercises = await ctx.runQuery(api.exercises.listExercises, {
        includeDeleted,
      });

      return new Response(JSON.stringify({ exercises }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error:
            error instanceof Error ? error.message : "Failed to list exercises",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

// PATCH /api/exercises/:id - Update exercise
http.route({
  path: "/api/exercises/{id}",
  method: "PATCH",
  handler: httpAction(async (ctx, request) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return new Response("Unauthorized", { status: 401 });
    }

    try {
      const id = request.url.split("/").pop();
      const body = await request.json();
      const { name } = body;

      if (!name || typeof name !== "string") {
        return new Response(
          JSON.stringify({ error: "Exercise name is required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      await ctx.runMutation(api.exercises.updateExercise, {
        id: id as any,
        name,
      });

      return new Response(
        JSON.stringify({
          id,
          name,
          updatedAt: Date.now(),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error:
            error instanceof Error
              ? error.message
              : "Failed to update exercise",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

// DELETE /api/exercises/:id - Soft delete exercise
http.route({
  path: "/api/exercises/{id}",
  method: "DELETE",
  handler: httpAction(async (ctx, request) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return new Response("Unauthorized", { status: 401 });
    }

    try {
      const id = request.url.split("/").pop()?.split("?")[0];

      await ctx.runMutation(api.exercises.deleteExercise, {
        id: id as any,
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error:
            error instanceof Error
              ? error.message
              : "Failed to delete exercise",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

// POST /api/exercises/:id/restore - Restore soft-deleted exercise
http.route({
  path: "/api/exercises/{id}/restore",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return new Response("Unauthorized", { status: 401 });
    }

    try {
      const pathSegments = request.url.split("/");
      const idIndex = pathSegments.indexOf("exercises") + 1;
      const id = pathSegments[idIndex];

      await ctx.runMutation(api.exercises.restoreExercise, {
        id: id as any,
      });

      // Fetch restored exercise
      const restored = await ctx.runQuery(api.exercises.getExercise, {
        id: id as any,
      });

      return new Response(
        JSON.stringify({
          id: restored?._id,
          name: restored?.name,
          deletedAt: null,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error:
            error instanceof Error
              ? error.message
              : "Failed to restore exercise",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

// POST /api/sets - Log a new set
http.route({
  path: "/api/sets",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return new Response("Unauthorized", { status: 401 });
    }

    try {
      const body = await request.json();
      const { exerciseId, reps, weight, unit } = body;

      if (!exerciseId || typeof exerciseId !== "string") {
        return new Response(
          JSON.stringify({ error: "Exercise ID is required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (!reps || typeof reps !== "number") {
        return new Response(JSON.stringify({ error: "Reps is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const setId = await ctx.runMutation(api.sets.logSet, {
        exerciseId: exerciseId as any,
        reps,
        weight,
        unit,
      });

      // Fetch created set to return full object
      const created = await ctx.runQuery(api.sets.getSet, {
        id: setId,
      });

      return new Response(
        JSON.stringify({
          id: created?._id,
          exerciseId: created?.exerciseId,
          reps: created?.reps,
          weight: created?.weight,
          unit: created?.unit,
          performedAt: created?.performedAt,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Failed to log set",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

// GET /api/sets - List sets (optionally filtered by exerciseId)
http.route({
  path: "/api/sets",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return new Response("Unauthorized", { status: 401 });
    }

    try {
      const url = new URL(request.url);
      const exerciseId = url.searchParams.get("exerciseId");

      const sets = await ctx.runQuery(api.sets.listSets, {
        exerciseId: exerciseId ? (exerciseId as any) : undefined,
      });

      return new Response(JSON.stringify({ sets }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Failed to list sets",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

// GET /api/sets/paginated - List sets with pagination
http.route({
  path: "/api/sets/paginated",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return new Response("Unauthorized", { status: 401 });
    }

    try {
      const url = new URL(request.url);
      const cursor = url.searchParams.get("cursor");
      const pageSizeParam = url.searchParams.get("pageSize");
      const numItems = pageSizeParam ? parseInt(pageSizeParam, 10) : 25;

      const result = await ctx.runQuery(api.sets.listSetsPaginated, {
        paginationOpts: {
          numItems,
          cursor: cursor || null,
        },
      });

      return new Response(
        JSON.stringify({
          sets: result.page,
          nextCursor: result.continueCursor,
          hasMore: !result.isDone,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error:
            error instanceof Error ? error.message : "Failed to paginate sets",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

// DELETE /api/sets/:id - Delete a set
http.route({
  path: "/api/sets/{id}",
  method: "DELETE",
  handler: httpAction(async (ctx, request) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return new Response("Unauthorized", { status: 401 });
    }

    try {
      const id = request.url.split("/").pop()?.split("?")[0];

      await ctx.runMutation(api.sets.deleteSet, {
        id: id as any,
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error:
            error instanceof Error ? error.message : "Failed to delete set",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

// GET /api/preferences - Get user preferences
http.route({
  path: "/api/preferences",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return new Response("Unauthorized", { status: 401 });
    }

    try {
      const preferences = await ctx.runQuery(
        api.userPreferences.getPreferences,
        {}
      );

      return new Response(JSON.stringify(preferences), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error:
            error instanceof Error
              ? error.message
              : "Failed to get preferences",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

// PATCH /api/preferences - Update user preferences
http.route({
  path: "/api/preferences",
  method: "PATCH",
  handler: httpAction(async (ctx, request) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return new Response("Unauthorized", { status: 401 });
    }

    try {
      const body = await request.json();
      const { weightUnit } = body;

      if (!weightUnit || (weightUnit !== "lbs" && weightUnit !== "kg")) {
        return new Response(
          JSON.stringify({ error: "Weight unit must be 'lbs' or 'kg'" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const result = await ctx.runMutation(
        api.userPreferences.updatePreferences,
        {
          weightUnit,
        }
      );

      return new Response(
        JSON.stringify({
          ...result,
          updatedAt: Date.now(),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error:
            error instanceof Error
              ? error.message
              : "Failed to update preferences",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

export default http;
