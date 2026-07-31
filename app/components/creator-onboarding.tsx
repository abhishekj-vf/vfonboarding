"use client";

import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle,
  Eye,
  GraduationCap,
  InstagramLogo,
  LockSimple,
  Phone,
  ShieldCheck,
  Sparkle,
  UsersThree,
  WarningCircle,
} from "@phosphor-icons/react";
import { FormEvent, KeyboardEvent, useRef, useState } from "react";
import { checkInstagramEligibility, ProfileCheck } from "../lib/eligibility";
import { BrandMark } from "./brand-mark";
import { StoreBadges } from "./store-badges";

type Stage = "profile" | "details" | "otp" | "success" | "existing";

const colleges = [
  "University of Delhi",
  "Mumbai University",
  "Christ University, Bengaluru",
  "Symbiosis International University",
  "NMIMS University",
  "Amity University",
  "Manipal Academy of Higher Education",
  "Ashoka University",
  "IIT Bombay",
  "IIT Delhi",
  "IIT Madras",
  "BITS Pilani",
  "VIT Vellore",
  "SRM Institute of Science and Technology",
  "Jadavpur University",
  "Savitribai Phule Pune University",
  "Bengaluru City University",
  "Other",
];

const stageStep: Record<Stage, number> = {
  profile: 1,
  details: 2,
  otp: 3,
  success: 3,
  existing: 1,
};

export function CreatorOnboarding() {
  const [stage, setStage] = useState<Stage>("profile");
  const [handle, setHandle] = useState("");
  const [profile, setProfile] = useState<ProfileCheck | null>(null);
  const [college, setCollege] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const step = stageStep[stage];

  function goBack() {
    setError("");
    if (stage === "details") {
      setStage("profile");
    } else if (stage === "otp") {
      setStage("details");
    }
  }

  async function checkProfile(event: FormEvent) {
    event.preventDefault();
    setError("");
    setProfile(null);

    const cleanHandle = handle
      .trim()
      .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
      .replace(/^@/, "")
      .replace(/\/.*$/, "");

    if (!/^[a-zA-Z0-9._]{2,30}$/.test(cleanHandle)) {
      setError("Enter a valid Instagram username or profile link.");
      return;
    }

    setChecking(true);
    const result = await checkInstagramEligibility(cleanHandle);
    setChecking(false);
    setProfile(result);

    if (result.hasExistingAccount) {
      setStage("existing");
    }
  }

  function continueToDetails() {
    if (profile?.eligible) {
      setStage("details");
      setError("");
    }
  }

  function submitDetails(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (college.trim().length < 2) {
      setError("Choose your college to continue.");
      return;
    }

    const cleanMobile = mobile.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    setMobile(cleanMobile);
    setStage("otp");
  }

  function updateOtp(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setError("");

    if (digit && index < otp.length - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function verifyOtp(event: FormEvent) {
    event.preventDefault();
    if (otp.some((digit) => !digit)) {
      setError("Enter the complete 6-digit code.");
      return;
    }
    setError("");
    setStage("success");
  }

  function resetProfile() {
    setHandle("");
    setProfile(null);
    setError("");
    setStage("profile");
  }

  return (
    <section className="onboarding-panel" aria-label="Creator signup">
      <div className="ambient-orb ambient-orb-one" aria-hidden="true" />
      <div className="ambient-orb ambient-orb-two" aria-hidden="true" />

      <div className="mobile-brand">
        <BrandMark />
        <span className="brand-chip">Creator club</span>
      </div>

      <div className="flow-nav">
        {stage === "details" || stage === "otp" ? (
          <button
            className="back-button"
            type="button"
            onClick={goBack}
            aria-label="Go back"
          >
            <ArrowLeft size={18} weight="bold" aria-hidden="true" />
          </button>
        ) : (
          <span className="back-placeholder" />
        )}

        {stage !== "success" && stage !== "existing" ? (
          <>
            <span className="progress-label">Step {step} of 3</span>
            <span className="progress-track" aria-hidden="true">
              <span
                className="progress-fill"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </span>
          </>
        ) : (
          <span className="progress-label">You’re all set</span>
        )}
      </div>

      <div className="form-wrap">
        {stage === "profile" && (
          <div>
            <p className="form-kicker">Start with your profile</p>
            <h2 className="form-title">Let’s see if you’re creator-ready.</h2>
            <p className="form-copy">
              Share your Instagram profile for a quick eligibility check. No
              password or posting permission required.
            </p>

            <div className="requirement-row" aria-label="Eligibility criteria">
              <span className="requirement">
                <Eye size={14} weight="bold" aria-hidden="true" />
                Public profile
              </span>
              <span className="requirement">
                <UsersThree size={14} weight="bold" aria-hidden="true" />
                5K+ followers
              </span>
            </div>

            <form onSubmit={checkProfile} noValidate>
              <div className="field">
                <label htmlFor="instagram">Instagram profile</label>
                <div className="input-shell">
                  <span className="input-icon" aria-hidden="true">
                    <InstagramLogo size={20} weight="bold" />
                  </span>
                  <input
                    id="instagram"
                    value={handle}
                    onChange={(event) => {
                      setHandle(event.target.value);
                      setProfile(null);
                      setError("");
                    }}
                    placeholder="yourhandle"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    aria-describedby={error ? "profile-error" : undefined}
                    aria-invalid={Boolean(error)}
                  />
                </div>
              </div>

              {error && (
                <p className="field-error" id="profile-error" role="alert">
                  {error}
                </p>
              )}

              {profile?.eligible && (
                <div className="profile-result" aria-live="polite">
                  <span className="profile-platform-icon" aria-hidden="true">
                    <InstagramLogo size={22} weight="duotone" />
                  </span>
                  <span className="profile-result-copy">
                    <span className="profile-result-heading">
                      <strong>@{profile.handle}</strong>
                      <span className="eligible-pill">
                        <CheckCircle size={15} weight="fill" aria-hidden="true" />
                        Eligible
                      </span>
                    </span>
                    <span className="profile-metrics">
                      <span>
                        {profile.followers.toLocaleString("en-IN")} followers
                      </span>
                      <span className="metric-divider" aria-hidden="true" />
                      <span>Public profile</span>
                    </span>
                  </span>
                </div>
              )}

              {profile && !profile.eligible && !profile.hasExistingAccount && (
                <div className="blocked-card" aria-live="polite">
                  <span className="blocked-icon" aria-hidden="true">
                    <WarningCircle size={22} weight="fill" />
                  </span>
                  <h3>
                    {profile.reason === "private"
                      ? "Your profile is private"
                      : "Keep growing. We see you."}
                  </h3>
                  <p>
                    {profile.reason === "private"
                      ? "Switch your Instagram to public, then come back and check again."
                      : "Creator access currently starts at 5,000 followers. You’re not far off."}
                  </p>
                  <button
                    className="text-button"
                    type="button"
                    onClick={resetProfile}
                  >
                    Try another profile
                    <ArrowRight size={15} weight="bold" aria-hidden="true" />
                  </button>
                </div>
              )}

              {!profile?.eligible &&
                !(profile && !profile.eligible && !profile.hasExistingAccount) && (
                  <button
                    className="primary-button"
                    type="submit"
                    disabled={checking}
                  >
                    {checking ? (
                      <>
                        <span className="spinner" aria-hidden="true" />
                        Checking your profile
                      </>
                    ) : (
                      <>
                        Check my eligibility
                        <ArrowRight
                          className="button-arrow"
                          size={18}
                          weight="bold"
                          aria-hidden="true"
                        />
                      </>
                    )}
                  </button>
                )}

              {profile?.eligible && (
                <button
                  className="primary-button"
                  type="button"
                  onClick={continueToDetails}
                >
                  Continue
                  <ArrowRight
                    className="button-arrow"
                    size={18}
                    weight="bold"
                    aria-hidden="true"
                  />
                </button>
              )}

              {!profile && (
                <p className="microcopy">
                  <LockSimple size={14} weight="bold" aria-hidden="true" />
                  Your profile info is used only for eligibility
                </p>
              )}
            </form>
          </div>
        )}

        {stage === "details" && (
          <div>
            <p className="form-kicker">Tell us the basics</p>
            <h2 className="form-title">Where do you create from?</h2>
            <p className="form-copy">
              Your campus helps us match you with the right drops, events, and
              brand opportunities.
            </p>

            <form onSubmit={submitDetails} noValidate>
              <div className="field">
                <label htmlFor="college">College or university</label>
                <div className="input-shell college-input">
                  <span className="input-icon" aria-hidden="true">
                    <GraduationCap size={20} weight="bold" />
                  </span>
                  <input
                    id="college"
                    list="college-list"
                    value={college}
                    onChange={(event) => {
                      setCollege(event.target.value);
                      setError("");
                    }}
                    placeholder="Start typing your college"
                    autoComplete="organization"
                  />
                  <datalist id="college-list">
                    {colleges.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="field">
                <label htmlFor="mobile">Mobile number</label>
                <div className="input-shell">
                  <span className="input-icon" aria-hidden="true">
                    <Phone size={19} weight="bold" />
                  </span>
                  <span className="country-prefix" aria-hidden="true">
                    +91
                  </span>
                  <input
                    id="mobile"
                    value={mobile}
                    onChange={(event) => {
                      setMobile(
                        event.target.value.replace(/\D/g, "").slice(0, 10),
                      );
                      setError("");
                    }}
                    placeholder="98765 43210"
                    autoComplete="tel-national"
                    inputMode="numeric"
                    aria-describedby={error ? "details-error" : undefined}
                    aria-invalid={Boolean(error)}
                  />
                </div>
              </div>

              {error && (
                <p className="field-error" id="details-error" role="alert">
                  {error}
                </p>
              )}

              <button className="primary-button" type="submit">
                Send code
                <ArrowRight
                  className="button-arrow"
                  size={18}
                  weight="bold"
                  aria-hidden="true"
                />
              </button>
              <p className="microcopy">
                <ShieldCheck size={14} weight="bold" aria-hidden="true" />
                We’ll never add you to a noisy WhatsApp group
              </p>
            </form>
          </div>
        )}

        {stage === "otp" && (
          <div>
            <p className="form-kicker">One last thing</p>
            <h2 className="form-title">Prove it’s really you.</h2>
            <p className="form-copy">
              Enter the 6-digit code sent to +91 •••••{" "}
              {mobile.slice(-5) || "00000"}. It should land in a few seconds.
            </p>

            <form onSubmit={verifyOtp} noValidate>
              <span className="field-label" id="otp-label">
                Verification code
              </span>
              <div className="otp-row" aria-labelledby="otp-label">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      otpRefs.current[index] = element;
                    }}
                    className="otp-input"
                    value={digit}
                    onChange={(event) => updateOtp(index, event.target.value)}
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    onFocus={(event) => event.target.select()}
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    aria-label={`Digit ${index + 1}`}
                    maxLength={1}
                  />
                ))}
              </div>

              {error && (
                <p className="field-error" role="alert">
                  {error}
                </p>
              )}

              <p className="resend-line">
                Didn’t get it?{" "}
                <button
                  type="button"
                  onClick={() => setOtp(["", "", "", "", "", ""])}
                >
                  Send again
                </button>
              </p>

              <button className="primary-button" type="submit">
                Verify and join
                <ArrowRight
                  className="button-arrow"
                  size={18}
                  weight="bold"
                  aria-hidden="true"
                />
              </button>
              <p className="microcopy">
                <LockSimple size={14} weight="bold" aria-hidden="true" />
                For this preview, any 6 digits will work
              </p>
            </form>
          </div>
        )}

        {stage === "success" && (
          <div className="success-wrap" aria-live="polite">
            <div className="success-burst" aria-hidden="true">
              <Check size={34} weight="bold" />
            </div>
            <p className="form-kicker">Welcome to the inner circle</p>
            <h2 className="form-title">You’re officially creator-ready.</h2>
            <p className="form-copy">
              Your profile is eligible and your spot is saved. Download the app
              to finish your creator profile and find your first collab.
            </p>
            <p className="download-label">Get the app</p>
            <StoreBadges />
            <p className="community-note">
              See you on the inside, @{profile?.handle || "creator"}
              <Sparkle size={13} weight="fill" aria-hidden="true" />
            </p>
          </div>
        )}

        {stage === "existing" && (
          <div className="success-wrap" aria-live="polite">
            <div className="success-burst" aria-hidden="true">
              <ArrowUpRight size={32} weight="bold" />
            </div>
            <p className="form-kicker">We know that profile</p>
            <h2 className="form-title">You’re already one of us.</h2>
            <p className="form-copy">
              An account already exists for @{profile?.handle}. Open the app and
              pick up where you left off.
            </p>
            <p className="download-label">Open or download the app</p>
            <StoreBadges />
            <button className="text-button" type="button" onClick={resetProfile}>
              Check a different profile
              <ArrowRight size={15} weight="bold" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
