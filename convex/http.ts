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
      const exercise = await ctx.runQuery(api.exercises.listExercises, {
        includeDeleted: true,
      });
      const created = exercise.find((e) => e._id === exerciseId);

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
      const exercises = await ctx.runQuery(api.exercises.listExercises, {
        includeDeleted: true,
      });
      const restored = exercises.find((e) => e._id === id);

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

export default http;
