import subprocess, os

BAT = r"C:\Users\Mada\Documents\foodflow\_sdk_install.bat"
OUT = r"C:\Users\Mada\Documents\foodflow\_sdk_log.txt"

env = dict(os.environ)
env["JAVA_HOME"] = r"C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot"
env["ANDROID_HOME"] = r"C:\Android\sdk"
env["PATH"] = env["JAVA_HOME"] + r"\bin;" + env["PATH"]

with open(OUT, "w", encoding="utf-8", errors="replace") as f:
    p = subprocess.run(
        ["cmd.exe", "/c", BAT],
        stdout=f, stderr=subprocess.STDOUT,
        env=env, timeout=4800,
    )
    f.write(f"\n\n=== RETURN CODE: {p.returncode} ===\n")

print("done, rc =", p.returncode)
print(open(OUT, encoding="utf-8", errors="replace").read()[-1500:])
