# PowerShell script to change Git author information

# Suppress filter-branch warning
$env:FILTER_BRANCH_SQUELCH_WARNING = 1

$OLD_NAME = "Sinisterchilll"
$OLD_EMAIL = "anucbs22@gmail.com"
$NEW_NAME = "'meetkool'" # Note the single quotes around the name
$NEW_EMAIL = "your.new@email.com"

# Create the filter-branch command
$filterCommand = @"
if [ "`$GIT_COMMITTER_NAME" = "$OLD_NAME" ] || [ "`$GIT_COMMITTER_EMAIL" = "$OLD_EMAIL" ]
then
    export GIT_COMMITTER_NAME=$NEW_NAME
    export GIT_COMMITTER_EMAIL="$NEW_EMAIL"
fi
if [ "`$GIT_AUTHOR_NAME" = "$OLD_NAME" ] || [ "`$GIT_AUTHOR_EMAIL" = "$OLD_EMAIL" ]
then
    export GIT_AUTHOR_NAME=$NEW_NAME
    export GIT_AUTHOR_EMAIL="$NEW_EMAIL"
fi
"@

# Execute the git filter-branch command
git filter-branch -f --env-filter $filterCommand --tag-name-filter cat -- --branches --tags

Write-Host "Git history has been rewritten. Use 'git push -f' to update remote repository."
