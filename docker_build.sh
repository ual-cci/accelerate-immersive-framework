# build the image
git pull 
sudo docker build -t mimic/dev_test .
# check what's running
sudo docker ps
# probably kill something
sudo docker kill (id of the thing I want to kill as seen in the list of dockers)
# run it 
sudo docker run -d -p 4001:8080  mimic/dev_test
