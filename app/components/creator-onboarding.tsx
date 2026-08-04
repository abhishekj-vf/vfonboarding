"use client";

import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ArrowClockwise,
  GraduationCap,
  InstagramLogo,
  Phone,
  ShieldCheck,
  Sparkle,
  Warning,
} from "@phosphor-icons/react";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { checkInstagramEligibility, ProfileCheck } from "../lib/eligibility";
import { BrandMark } from "./brand-mark";
import { StoreBadges } from "./store-badges";

type Stage = "profile" | "details" | "otp" | "success" | "existing";

type CreatorOnboardingProps = {
  onVisualChange: (scene: number, signal: number) => void;
};

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

const stageScene: Record<Stage, number> = {
  profile: 0,
  details: 1,
  otp: 2,
  success: 1,
  existing: 2,
};

const stageCopy: Record<Stage, { label: string; title: string; copy: string }> = {
  profile: {
    label: "Creator roll call / 01",
    title: "Your point of view has a pulse.",
    copy: "We appreciate the cut, the caption, the take, the timing. Let us see what you make the room feel.",
  },
  details: {
    label: "The coordinates / 02",
    title: "Tell us where the culture happens.",
    copy: "Your campus is more than an address. It is where your next audience already lives.",
  },
  otp: {
    label: "One signal / 03",
    title: "The stage knows your name.",
    copy: "Enter the code we sent. It is a small pause before the good part.",
  },
  success: {
    label: "Creator club / unlocked",
    title: "Craft clocked. Thank you.",
    copy: "Your perspective belongs in the conversation. Your place is waiting inside ViralFission.",
  },
  existing: {
    label: "Already on the list",
    title: "Your voice is already in the room.",
    copy: "We found your profile. Open the app and pick the story back up.",
  },
};

export function CreatorOnboarding({ onVisualChange }: CreatorOnboardingProps) {
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
  const signal =
    stage === "profile"
      ? Math.min(handle.length / 18, 1)
      : stage === "details"
        ? Math.min((college.length + mobile.length) / 34, 1)
        : stage === "otp"
          ? otp.filter(Boolean).length / otp.length
          : 1;

  useEffect(() => {
    onVisualChange(stageScene[stage], signal);
  }, [onVisualChange, signal, stage]);

  function goBack() {
    setError("");
    setStage(stage === "otp" ? "details" : "profile");
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
      setError("Drop a valid Instagram username or profile link.");
      return;
    }

    setChecking(true);
    const result = await checkInstagramEligibility(cleanHandle);
    setChecking(false);
    setProfile(result);
    if (result.hasExistingAccount) {
      setStage("existing");
    } else if (result.eligible) {
      setStage("details");
    }
  }

  function submitDetails(event: FormEvent) {
    event.preventDefault();
    const cleanMobile = mobile.replace(/\D/g, "");
    if (college.trim().length < 2) {
      setError("Tell us your college first.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    setMobile(cleanMobile);
    setError("");
    setStage("otp");
  }

  function updateOtp(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setError("");
    if (digit && index < otp.length - 1) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function verifyOtp(event: FormEvent) {
    event.preventDefault();
    const code = otp.join("");
    if (code.length < otp.length) {
      setError("Enter all 6 digits to continue.");
      return;
    }
    if (code !== "111111") {
      setError("Invalid code. Use 111111 for this prototype.");
      return;
    }
    setError("");
    setStage("success");
  }

  function resendCode() {
    setOtp(["", "", "", "", "", ""]);
    setError("");
    requestAnimationFrame(() => otpRefs.current[0]?.focus());
  }

  function resetProfile() {
    setStage("profile");
    setProfile(null);
    setHandle("");
    setError("");
  }

  const copy = stageCopy[stage];

  return (
    <section className="onboarding-panel" aria-label="Creator signup">
      <header className="experience-header">
        <BrandMark />
        <p className="edition-mark">Creator club / India</p>
        <p className="signal-mark" aria-label={`Step ${step} of 3`}>
          0{step} / 03
        </p>
      </header>

      <div className="stage-meter" aria-hidden="true">
        <span style={{ width: `${(step / 3) * 100}%` }} />
      </div>

      <div className="hero-statement" aria-live="polite">
        <p>{copy.label}</p>
        <h1>{copy.title}</h1>
      </div>

      <div className="signup-stage">
        <div className="stage-context">
          {(stage === "details" || stage === "otp") && (
            <button className="back-control" type="button" onClick={goBack}><ArrowLeft size={18} weight="bold" /> Back</button>
          )}
          <div className="stage-aside">
            <span>VF / CREATOR EDITION</span>
            <span>NO PASSWORDS. NO POSTING PERMISSION.</span>
          </div>
        </div>

        <div className="stage-content">
          <p className="stage-copy">{copy.copy}</p>

          {stage === "profile" && (
            <form onSubmit={checkProfile} className="stage-form" noValidate>
              <label className="field-label" htmlFor="instagram">Your Instagram</label>
              <div className="line-input">
                <InstagramLogo size={23} weight="bold" aria-hidden="true" />
                <input
                  id="instagram"
                  value={handle}
                  onChange={(event) => {
                    setHandle(event.target.value);
                    setProfile(null);
                    setError("");
                  }}
                  placeholder="@yourhandle"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-invalid={Boolean(error)}
                />
                <button className="arrow-submit" type="submit" disabled={checking} aria-label="Check eligibility">
                  {checking ? "..." : <ArrowRight size={24} weight="bold" aria-hidden="true" />}
                </button>
              </div>
              {error && <p className="field-error" role="alert">{error}</p>}

              {profile && !profile.eligible && !profile.hasExistingAccount && (
                <div className="profile-response is-blocked" aria-live="polite">
                  <span className="profile-response-icon"><Warning size={19} weight="fill" /></span>
                  <span><strong>{profile.reason === "private" ? "Your profile is private." : "Nearly there."}</strong> <em>{profile.reason === "private" ? "Switch it public so we can see your work." : "Creator Club begins at 5K followers."}</em></span>
                </div>
              )}
              <p className="quiet-note"><ShieldCheck size={14} weight="bold" /> We only use this to check eligibility.</p>
            </form>
          )}

          {stage === "details" && (
            <form onSubmit={submitDetails} className="stage-form" noValidate>
              <div className="dual-fields">
                <label className="stacked-field" htmlFor="college"><span>College or university</span><span className="line-input"><GraduationCap size={21} weight="bold" /><input id="college" list="college-list" value={college} onChange={(event) => { setCollege(event.target.value); setError(""); }} placeholder="Start typing" autoComplete="organization" /></span></label>
                <datalist id="college-list">{colleges.map((name) => <option key={name} value={name} />)}</datalist>
                <label className="stacked-field" htmlFor="mobile"><span>Mobile number</span><span className="line-input"><Phone size={20} weight="bold" /><b>+91</b><input id="mobile" value={mobile} onChange={(event) => { setMobile(event.target.value.replace(/\D/g, "").slice(0, 10)); setError(""); }} placeholder="98765 43210" inputMode="numeric" autoComplete="tel-national" /></span></label>
              </div>
              {error && <p className="field-error" role="alert">{error}</p>}
              <button className="command-button" type="submit">Send the signal <ArrowRight size={20} weight="bold" /></button>
            </form>
          )}

          {stage === "otp" && (
            <form onSubmit={verifyOtp} className="stage-form" noValidate>
              <span className="field-label">Six-digit verification code</span>
              <div className="otp-row">
                {otp.map((digit, index) => (
                  <input key={index} ref={(element) => { otpRefs.current[index] = element; }} className="otp-input" value={digit} onChange={(event) => updateOtp(index, event.target.value)} onKeyDown={(event) => handleOtpKeyDown(index, event)} onFocus={(event) => event.target.select()} inputMode="numeric" autoComplete={index === 0 ? "one-time-code" : "off"} aria-label={`Digit ${index + 1}`} maxLength={1} />
                ))}
              </div>
              {error && <p className="field-error" role="alert">{error}</p>}
              <button className="command-button" type="submit">Verify and enter <ArrowRight size={20} weight="bold" /></button>
              <button className="resend-code-button" type="button" onClick={resendCode}>
                <ArrowClockwise size={14} weight="bold" /> Resend code
              </button>
            </form>
          )}

          {stage === "success" && (
            <div className="final-stage" aria-live="polite">
              <div className="final-status">
                <span className="final-mark"><Check size={24} weight="bold" /></span>
                <p>See you inside, @{profile?.handle || "creator"}. <Sparkle size={14} weight="fill" /></p>
              </div>
              <StoreBadges />
            </div>
          )}

          {stage === "existing" && (
            <div className="final-stage" aria-live="polite">
              <span className="final-mark"><ArrowUpRight size={30} weight="bold" /></span>
              <StoreBadges />
              <button className="reset-button" type="button" onClick={resetProfile}>Try another profile <ArrowRight size={16} weight="bold" /></button>
            </div>
          )}
        </div>
      </div>

    </section>
  );
}
