# gitpush.ps1
param (
    [string]$commitMessage = "Auto commit"
)

git add .
git commit -m $commitMessage
git push
