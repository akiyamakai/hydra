import { useEffect, useState } from "react";
import ISO6391 from "iso-639-1";

import { TextField, Button, CheckboxField, Select } from "@renderer/components";
import { useTranslation } from "react-i18next";
import * as styles from "./settings-general.css";
import type { UserPreferences } from "@types";

import { changeLanguage } from "i18next";
import * as languageResources from "@locales";

interface LanguageOption {
  option: string;
  nativeName: string;
}

export interface SettingsGeneralProps {
  userPreferences: UserPreferences | null;
  updateUserPreferences: (values: Partial<UserPreferences>) => void;
}

export function SettingsGeneral({
  userPreferences,
  updateUserPreferences,
}: SettingsGeneralProps) {
  const { t } = useTranslation("settings");

  const [form, setForm] = useState({
    downloadsPath: "",
    downloadNotificationsEnabled: false,
    repackUpdatesNotificationsEnabled: false,
    language: "",
  });

  const [languageOptions, setLanguageOptions] = useState<LanguageOption[]>([]);

  const [defaultDownloadsPath, setDefaultDownloadsPath] = useState("");

  useEffect(() => {
    async function fetchdefaultDownloadsPath() {
      setDefaultDownloadsPath(await window.electron.getDefaultDownloadsPath());
    }

    fetchdefaultDownloadsPath();

    setLanguageOptions(
      Object.keys(languageResources)
        .map((language) => {
          return {
            nativeName: ISO6391.getNativeName(language),
            option: language,
          };
        })
        .sort((a, b) => {
          if (a.nativeName < b.nativeName) return -1;
          if (a.nativeName > b.nativeName) return 1;
          return 0;
        })
    );
  }, []);

  useEffect(updateFormWithUserPreferences, [
    userPreferences,
    defaultDownloadsPath,
  ]);

  const handleLanguageChange = (event) => {
    const value = event.target.value;

    handleChange({ language: value });
    changeLanguage(value);
  };

  const handleChange = (values: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...values }));
    updateUserPreferences(values);
  };

  const handleChooseDownloadsPath = async () => {
    const { filePaths } = await window.electron.showOpenDialog({
      defaultPath: form.downloadsPath,
      properties: ["openDirectory"],
    });

    if (filePaths && filePaths.length > 0) {
      const path = filePaths[0];
      handleChange({ downloadsPath: path });
    }
  };

  function updateFormWithUserPreferences() {
    if (userPreferences) {
      const parsedLanguage = userPreferences.language.split("-")[0];

      setForm((prev) => ({
        ...prev,
        downloadsPath: userPreferences.downloadsPath ?? defaultDownloadsPath,
        downloadNotificationsEnabled:
          userPreferences.downloadNotificationsEnabled,
        repackUpdatesNotificationsEnabled:
          userPreferences.repackUpdatesNotificationsEnabled,
        language: parsedLanguage,
      }));
    }
  }

  return (
    <>
      <div className={styles.downloadsPathField}>
        <TextField
          label={t("downloads_path")}
          value={form.downloadsPath}
          readOnly
          disabled
        />

        <Button
          style={{ alignSelf: "flex-end" }}
          theme="outline"
          onClick={handleChooseDownloadsPath}
        >
          {t("change")}
        </Button>
      </div>

      <h3>{t("language")}</h3>
      <>
        <Select value={form.language} onChange={handleLanguageChange}>
          {languageOptions.map((language) => (
            <option key={language.option} value={language.option}>
              {language.nativeName}
            </option>
          ))}
        </Select>
      </>

      <h3>{t("notifications")}</h3>
      <>
        <CheckboxField
          label={t("enable_download_notifications")}
          checked={form.downloadNotificationsEnabled}
          onChange={() =>
            handleChange({
              downloadNotificationsEnabled: !form.downloadNotificationsEnabled,
            })
          }
        />

        <CheckboxField
          label={t("enable_repack_list_notifications")}
          checked={form.repackUpdatesNotificationsEnabled}
          onChange={() =>
            handleChange({
              repackUpdatesNotificationsEnabled:
                !form.repackUpdatesNotificationsEnabled,
            })
          }
        />
      </>
    </>
  );
}
