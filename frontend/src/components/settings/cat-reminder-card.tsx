"use client";

import { useEffect, useState } from "react";
import { CAT_EVENT, isCatEnabled, setCatEnabled } from "@/components/cat-reminder";
import { WalkingCat } from "@/components/cats";
import { Button, Card } from "@/components/ui";
import { useI18n } from "@/i18n/provider";

/** Bật / tắt mèo nhắc việc trên thiết bị này + gọi mèo ra thử. */
export function CatReminderCard() {
  const { t } = useI18n();
  const st = t.settings;
  const [enabled, setEnabled] = useState(true);

  // Đọc localStorage sau khi mount — server không biết tuỳ chọn của từng thiết bị
  // eslint-disable-next-line react-hooks/set-state-in-effect -- chỉ đọc được localStorage phía client
  useEffect(() => setEnabled(isCatEnabled()), []);

  return (
    <Card className="flex flex-wrap items-center gap-5 p-6">
      <WalkingCat className="w-20 shrink-0" />
      <div className="min-w-0 flex-1 space-y-3">
        <div>
          <h2 className="text-lg font-bold">{st.catTitle}</h2>
          <p className="text-sm text-fg-2">{st.catHint}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => {
                setEnabled(e.target.checked);
                setCatEnabled(e.target.checked);
              }}
              className="h-4 w-4"
            />
            {st.catEnabled}
          </label>
          <Button variant="secondary" size="sm" onClick={() => window.dispatchEvent(new Event(CAT_EVENT))}>
            🐾 {st.catTry}
          </Button>
        </div>
      </div>
    </Card>
  );
}
