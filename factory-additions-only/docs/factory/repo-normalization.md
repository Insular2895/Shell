# Repo normalization

Cf `repo-factory-shell/README.md`.

Quand on intègre un repo Python métier dans la factory :
1. `factory repo:audit ./repo` → rapport stack/deps/risque
2. `factory repo:normalize ./repo` → restructure pour respect des conventions
3. `factory repo:connect ./repo ./template` → connecte au template
