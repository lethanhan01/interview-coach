import { test, expect, type Page } from "@playwright/test";

const SESSION_ID = "sess-abc";
const MOCK_QUESTIONS = [
  { id: "q1", content: "Hãy giới thiệu về bản thân bạn.", orderIndex: 1 },
  { id: "q2", content: "Điểm mạnh của bạn là gì?", orderIndex: 2 },
];

test.beforeEach(async ({ page }) => {
  await page.route("**/auth/v1/user**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: "u1", email: "test@example.com" }),
    });
  });

  await page.route(
    `**/api/v1/sessions/${SESSION_ID}/questions`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ questions: MOCK_QUESTIONS }),
      });
    },
  );

  await page.route(`**/api/v1/sessions/${SESSION_ID}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: SESSION_ID,
        status: "active",
        sessionType: "hr",
        contextPackId: "VN",
        numQuestions: MOCK_QUESTIONS.length,
        durationMin: 30,
      }),
    });
  });

  await page.route(`**/api/v1/sessions/${SESSION_ID}/status`, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "active",
          numQuestions: MOCK_QUESTIONS.length,
        }),
      });
      return;
    }
    await route.fallback();
  });

  await page.route(
    `**/api/v1/sessions/${SESSION_ID}/feedback-progress`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          sessionId: SESSION_ID,
          status: "completing",
          totalQuestions: MOCK_QUESTIONS.length,
          answeredQuestions: MOCK_QUESTIONS.length,
          skippedQuestions: 0,
          feedbackRequired: MOCK_QUESTIONS.length,
          feedbackCompleted: 0,
          feedbackPending: MOCK_QUESTIONS.length,
          reportReady: false,
        }),
      });
    },
  );

  await page.route(
    `**/api/v1/sessions/${SESSION_ID}/events**`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        headers: { "Cache-Control": "no-cache", Connection: "keep-alive" },
        body: "",
      });
    },
  );
});

test("câu hỏi đầu tiên hiển thị sau khi load", async ({ page }) => {
  await page.goto(`/sessions/${SESSION_ID}`);
  await expect(page.getByText(MOCK_QUESTIONS[0].content)).toBeVisible({
    timeout: 10000,
  });
});

test("resume phiên đã trả lời một phần mở ở câu chưa trả lời đầu tiên", async ({
  page,
}) => {
  await page.route(
    `**/api/v1/sessions/${SESSION_ID}/questions`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          questions: [
            { ...MOCK_QUESTIONS[0], answered: true, answerId: "answer-1" },
            { ...MOCK_QUESTIONS[1], answered: false },
          ],
          currentIndex: 1,
        }),
      });
    },
  );

  let status: "active" | "paused" = "active";
  await page.route(`**/api/v1/sessions/${SESSION_ID}/status`, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status, numQuestions: MOCK_QUESTIONS.length }),
      });
      return;
    }

    const payload = route.request().postDataJSON() as {
      status: "active" | "paused";
      remainingSeconds?: number;
    };
    status = payload.status;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: SESSION_ID,
        status,
        sessionType: "hr",
        contextPackId: "VN",
        numQuestions: MOCK_QUESTIONS.length,
        durationMin: 30,
        remainingSeconds: payload.remainingSeconds ?? 30 * 60,
      }),
    });
  });

  await page.goto(`/sessions/${SESSION_ID}`);

  await expect(page.getByText(MOCK_QUESTIONS[1].content)).toBeVisible({
    timeout: 10000,
  });
  await expect(page.getByText(MOCK_QUESTIONS[0].content)).not.toBeVisible();

  await page.getByRole("button", { name: "Tạm dừng" }).click();
  await expect(page.getByText("Phiên phỏng vấn đang tạm dừng")).toBeVisible();
  await page.getByRole("button", { name: "Tiếp tục" }).click();

  await expect(page.getByText(MOCK_QUESTIONS[1].content)).toBeVisible();
  await expect(page.getByText("Câu 2 / 2")).toBeVisible();
});

test("QG-17: frontend polling tiếp tục khi /questions tạm thời rỗng", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = ((
      handler: TimerHandler,
      timeout?: number,
      ...args: unknown[]
    ) =>
      originalSetTimeout(
        handler,
        Math.min(timeout ?? 0, 20),
        ...args,
      )) as typeof window.setTimeout;
  });

  let questionCalls = 0;
  await page.route(
    `**/api/v1/sessions/${SESSION_ID}/questions`,
    async (route) => {
      questionCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          questions: questionCalls < 3 ? [] : MOCK_QUESTIONS,
        }),
      });
    },
  );

  await page.goto(`/sessions/${SESSION_ID}`);

  await expect(page.getByText(MOCK_QUESTIONS[0].content)).toBeVisible({
    timeout: 10000,
  });
  expect(questionCalls).toBeGreaterThanOrEqual(3);
});

async function installMockEventSource(page: Page) {
  await page.addInitScript(() => {
    const sources: Array<{
      listeners: Record<string, Array<(event: MessageEvent) => void>>;
      emit: (type: string, data: unknown) => void;
      close: () => void;
    }> = [];

    class MockEventSource {
      listeners: Record<string, Array<(event: MessageEvent) => void>> = {};

      constructor() {
        sources.push(this);
      }

      addEventListener(type: string, listener: EventListener) {
        this.listeners[type] ??= [];
        this.listeners[type].push(listener as (event: MessageEvent) => void);
      }

      emit(type: string, data: unknown) {
        const event = new MessageEvent(type, { data: JSON.stringify(data) });
        for (const listener of this.listeners[type] ?? []) listener(event);
      }

      close() {}
    }

    (
      window as typeof window & { __mockEventSources?: typeof sources }
    ).__mockEventSources = sources;
    (
      window as typeof window & { EventSource: typeof EventSource }
    ).EventSource = MockEventSource as unknown as typeof EventSource;
  });
}

test("QG-18: SSE active trigger refetch questions khi polling chưa thấy câu hỏi", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = ((
      handler: TimerHandler,
      timeout?: number,
      ...args: unknown[]
    ) =>
      originalSetTimeout(
        handler,
        Math.min(timeout ?? 0, 20),
        ...args,
      )) as typeof window.setTimeout;
  });
  await installMockEventSource(page);

  let exposeQuestions = false;
  await page.route(
    `**/api/v1/sessions/${SESSION_ID}/questions`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          questions: exposeQuestions ? MOCK_QUESTIONS : [],
        }),
      });
    },
  );

  await page.goto(`/sessions/${SESSION_ID}`);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as typeof window & { __mockEventSources?: unknown[] })
            .__mockEventSources?.length ?? 0,
      ),
    )
    .toBeGreaterThan(0);

  exposeQuestions = true;
  await page.evaluate((sessionId) => {
    const source = (
      window as typeof window & {
        __mockEventSources: Array<{
          emit: (type: string, data: unknown) => void;
        }>;
      }
    ).__mockEventSources[0];
    source.emit("session.status", { status: "active", sessionId });
  }, SESSION_ID);

  await expect(page.getByText(MOCK_QUESTIONS[0].content)).toBeVisible({
    timeout: 10000,
  });
});

test("QG-19: SSE error hiển thị lỗi rõ ràng thay vì chờ polling timeout", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = ((
      handler: TimerHandler,
      timeout?: number,
      ...args: unknown[]
    ) =>
      originalSetTimeout(
        handler,
        Math.min(timeout ?? 0, 20),
        ...args,
      )) as typeof window.setTimeout;
  });
  await installMockEventSource(page);

  await page.route(
    `**/api/v1/sessions/${SESSION_ID}/questions`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ questions: [] }),
      });
    },
  );

  await page.goto(`/sessions/${SESSION_ID}`);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as typeof window & { __mockEventSources?: unknown[] })
            .__mockEventSources?.length ?? 0,
      ),
    )
    .toBeGreaterThan(0);

  await page.evaluate((sessionId) => {
    const source = (
      window as typeof window & {
        __mockEventSources: Array<{
          emit: (type: string, data: unknown) => void;
        }>;
      }
    ).__mockEventSources[0];
    source.emit("session.status", { status: "error", sessionId });
  }, SESSION_ID);

  await expect(
    page.getByText(
      "Không thể tạo câu hỏi cho phiên phỏng vấn này. Vui lòng thử tạo phiên mới.",
    ),
  ).toBeVisible();
});

test("mode toggle giữa Text và Giọng nói", async ({ page }) => {
  await page.goto(`/sessions/${SESSION_ID}`);
  await expect(page.getByText(MOCK_QUESTIONS[0].content)).toBeVisible({
    timeout: 10000,
  });

  const voiceBtn = page.getByRole("button", { name: "Giọng nói" });
  await voiceBtn.click();
  await expect(page.getByRole("button", { name: "Text" })).toBeVisible();

  const textBtn = page.getByRole("button", { name: "Text" });
  await textBtn.click();
});

test("text mode: submit answer gọi POST /turns", async ({ page }) => {
  let turnCalled = false;
  await page.route(`**/api/v1/sessions/${SESSION_ID}/turns`, async (route) => {
    turnCalled = true;
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ id: "turn-1" }),
    });
  });
  await page.route(`**/api/v1/sessions/${SESSION_ID}/status`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "{}",
    });
  });

  await page.goto(`/sessions/${SESSION_ID}`);
  await expect(page.getByText(MOCK_QUESTIONS[0].content)).toBeVisible({
    timeout: 10000,
  });

  const textarea = page.getByRole("textbox");
  await textarea.fill(
    "Tôi là sinh viên CNTT năm 4, có kinh nghiệm thực tập frontend 3 tháng.",
  );
  await page.getByRole("button", { name: /gửi|submit/i }).click();

  await expect.poll(() => turnCalled).toBe(true);
});

test("có thể tạm dừng phiên phỏng vấn đang chạy", async ({ page }) => {
  let pausePayload: { status?: string; remainingSeconds?: number } | undefined;
  await page.route(`**/api/v1/sessions/${SESSION_ID}/status`, async (route) => {
    pausePayload = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: SESSION_ID,
        status: "paused",
        sessionType: "hr",
        contextPackId: "VN",
        remainingSeconds: pausePayload?.remainingSeconds,
      }),
    });
  });

  await page.goto(`/sessions/${SESSION_ID}`);
  await expect(page.getByText(MOCK_QUESTIONS[0].content)).toBeVisible({
    timeout: 10000,
  });
  await page.getByRole("button", { name: "Tạm dừng" }).click();

  await expect(page.getByText("Phiên phỏng vấn đang tạm dừng")).toBeVisible();
  expect(pausePayload?.status).toBe("paused");
  expect(pausePayload?.remainingSeconds).toBeGreaterThan(0);
  expect(pausePayload?.remainingSeconds).toBeLessThanOrEqual(30 * 60);
});

test("hết giờ tự động skip câu chưa trả lời và chuyển sang trang báo cáo", async ({
  page,
}) => {
  let timeoutPayload:
    | {
        status?: string;
        autoSkipUnanswered?: boolean;
        remainingSeconds?: number;
      }
    | undefined;

  await page.route(`**/api/v1/sessions/${SESSION_ID}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: SESSION_ID,
        status: "active",
        sessionType: "hr",
        contextPackId: "VN",
        numQuestions: MOCK_QUESTIONS.length,
        durationMin: 30,
        remainingSeconds: 1,
      }),
    });
  });
  await page.route(`**/api/v1/sessions/${SESSION_ID}/status`, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "active",
          numQuestions: MOCK_QUESTIONS.length,
        }),
      });
      return;
    }

    timeoutPayload = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: SESSION_ID, status: "completing" }),
    });
  });
  await page.route(`**/api/v1/sessions/${SESSION_ID}/report`, async (route) => {
    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({
        errorCode: "REPORT_NOT_READY",
        message: "REPORT_NOT_READY",
      }),
    });
  });

  await page.goto(`/sessions/${SESSION_ID}`);
  await expect(page.getByText(MOCK_QUESTIONS[0].content)).toBeVisible({
    timeout: 10000,
  });

  await expect.poll(() => timeoutPayload).toEqual({
    status: "completed",
    autoSkipUnanswered: true,
    remainingSeconds: 0,
  });
  await expect(page).toHaveURL(`/sessions/${SESSION_ID}/report`);
});

test("khi session kết thúc, chuyển sang trang chờ báo cáo", async ({
  page,
}) => {
  await page.route(`**/api/v1/sessions/${SESSION_ID}/status`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        route.request().method() === "GET"
          ? { status: "active", numQuestions: MOCK_QUESTIONS.length }
          : { status: "completing" },
      ),
    });
  });
  await page.route(`**/api/v1/sessions/${SESSION_ID}/turns`, async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ id: "turn-1" }),
    });
  });
  await page.route(`**/api/v1/sessions/${SESSION_ID}/report`, async (route) => {
    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({
        errorCode: "REPORT_NOT_READY",
        message: "REPORT_NOT_READY",
      }),
    });
  });
  await page.route(`**/api/v1/sessions/${SESSION_ID}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: SESSION_ID,
        status: "active",
        sessionType: "hr",
        contextPackId: "VN",
      }),
    });
  });

  await page.goto(`/sessions/${SESSION_ID}`);
  await expect(page.getByText(MOCK_QUESTIONS[0].content)).toBeVisible({
    timeout: 10000,
  });

  for (let i = 0; i < MOCK_QUESTIONS.length; i++) {
    const textarea = page.getByRole("textbox");
    await textarea.fill("Câu trả lời mẫu cho câu hỏi này.");
    await page.getByRole("button", { name: /gửi|submit/i }).click();
    if (i < MOCK_QUESTIONS.length - 1) {
      await expect(page.getByText(MOCK_QUESTIONS[i + 1].content)).toBeVisible({
        timeout: 5000,
      });
    }
  }

  await expect(page).toHaveURL(`/sessions/${SESSION_ID}/report`);
  await expect(page.getByText("Đã chấm 0/2 câu trả lời")).toBeVisible();
});
