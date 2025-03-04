#!/bin/bash

git filter-branch --env-filter '
OLD_NAME="Sinisterchilll"
OLD_EMAIL="anucbs22@gmail.com"
NEW_NAME="Your New Name"
NEW_EMAIL="your.new@email.com"

if [ "$GIT_COMMITTER_NAME" = "$OLD_NAME" ] || [ "$GIT_COMMITTER_EMAIL" = "$OLD_EMAIL" ]
then
    export GIT_COMMITTER_NAME="$NEW_NAME"
    export GIT_COMMITTER_EMAIL="$NEW_EMAIL"
fi
if [ "$GIT_AUTHOR_NAME" = "$OLD_NAME" ] || [ "$GIT_AUTHOR_EMAIL" = "$OLD_EMAIL" ]
then
    export GIT_AUTHOR_NAME="$NEW_NAME"
    export GIT_AUTHOR_EMAIL="$NEW_EMAIL"
fi
' --tag-name-filter cat -- --branches --tags